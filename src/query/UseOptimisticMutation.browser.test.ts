import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ApiError } from '../foundation/http';

import { defineEndpoint } from './Endpoints';
import { createQueryWrapper, createTestQueryClient } from './QueryTestUtils';
import { useAppQuery } from './UseAppQuery';
import { useOptimisticMutation } from './UseOptimisticMutation';

/** A promise plus its resolve/reject handles. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** The cached list shape the fake codes API below serves. */
interface CodeDto {
  readonly id: string;
}

/** The one-target remove-by-id config the single-key tests share. */
function removeCodeTarget() {
  return {
    key: ['codes', 'list'],
    apply: (codes: readonly CodeDto[] | undefined, vars: { id: string }) =>
      (codes ?? []).filter((code) => code.id !== vars.id),
  } as const;
}

describe('useOptimisticMutation', () => {
  it('applies the patch before the server responds; success keeps it and invalidates the target', async () => {
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const d = deferred<null>();
    client.setQueryData(['codes', 'list'], [{ id: 'a' }, { id: 'b' }]);

    const { result } = renderHook(
      () =>
        useOptimisticMutation<null, { id: string }>({
          mutationFn: () => d.promise,
          targets: [removeCodeTarget()],
        }),
      { wrapper: createQueryWrapper(client) },
    );

    act(() => {
      result.current.mutate({ id: 'a' });
    });

    // Optimistic: the cache is patched while the request is still in flight.
    await waitFor(() => expect(client.getQueryData(['codes', 'list'])).toEqual([{ id: 'b' }]));
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.data).toBeUndefined(); // no server value yet — the patch is cache-only
    expect(invalidate).not.toHaveBeenCalled();

    await act(async () => {
      d.resolve(null);
      await d.promise;
    });

    // Confirmed: the patch stays and the target key reconciles via invalidation.
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(client.getQueryData(['codes', 'list'])).toEqual([{ id: 'b' }]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['codes', 'list'] });
    expect(result.current.error).toBeNull();
  });

  it('rolls the cache back to the exact snapshot on error, coerces to ApiError, and still reconciles', async () => {
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const d = deferred<null>();
    client.setQueryData(['codes', 'list'], [{ id: 'a' }, { id: 'b' }]);

    const { result } = renderHook(
      () =>
        useOptimisticMutation<null, { id: string }>({
          mutationFn: () => d.promise,
          targets: [removeCodeTarget()],
        }),
      { wrapper: createQueryWrapper(client) },
    );

    act(() => {
      result.current.mutate({ id: 'b' });
    });
    await waitFor(() => expect(client.getQueryData(['codes', 'list'])).toEqual([{ id: 'a' }]));

    act(() => {
      d.reject(new ApiError(409, null, 'conflict'));
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.error?.status).toBe(409);
    expect(client.getQueryData(['codes', 'list'])).toEqual([{ id: 'a' }, { id: 'b' }]); // snapshot restored
    expect(result.current.data).toBeUndefined();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['codes', 'list'] }); // settle reconciles even after failure
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('patches several targets from one mutation and rolls every one back on error', async () => {
    const client = createTestQueryClient();
    const d = deferred<null>();
    client.setQueryData(['codes', 'list'], [{ id: 'a' }, { id: 'b' }]);
    client.setQueryData(['codes', 'stats'], { total: 2 });

    const { result } = renderHook(
      () =>
        useOptimisticMutation<null, { id: string }>({
          mutationFn: () => d.promise,
          targets: [
            removeCodeTarget(),
            {
              key: ['codes', 'stats'],
              apply: (stats: { total: number } | undefined) => ({ total: (stats?.total ?? 0) - 1 }),
            },
          ],
        }),
      { wrapper: createQueryWrapper(client) },
    );

    act(() => {
      result.current.mutate({ id: 'a' });
    });

    // Both targets patched from the one mutate.
    await waitFor(() => expect(client.getQueryData(['codes', 'list'])).toEqual([{ id: 'b' }]));
    expect(client.getQueryData(['codes', 'stats'])).toEqual({ total: 1 });

    act(() => {
      d.reject(new Error('nope'));
    });

    // Both targets restored; a plain Error coerces to status 0.
    await waitFor(() => expect(client.getQueryData(['codes', 'list'])).toEqual([{ id: 'a' }, { id: 'b' }]));
    expect(client.getQueryData(['codes', 'stats'])).toEqual({ total: 2 });
    await waitFor(() => expect(result.current.error?.status).toBe(0));
  });

  it('chains snapshots across concurrent mutations on one key — rollbacks unwind in order', async () => {
    const client = createTestQueryClient();
    client.setQueryData(['count'], 0);
    const d1 = deferred<null>();
    const d2 = deferred<null>();
    const options = (promise: Promise<null>) => ({
      mutationFn: () => promise,
      targets: [{ key: ['count'], apply: (count: number | undefined, delta: number) => (count ?? 0) + delta }],
      invalidateOnSettle: false, // keep the cache under test — no settle reconciliation
    });

    const first = renderHook(() => useOptimisticMutation<null, number>(options(d1.promise)), {
      wrapper: createQueryWrapper(client),
    });
    const second = renderHook(() => useOptimisticMutation<null, number>(options(d2.promise)), {
      wrapper: createQueryWrapper(client),
    });

    act(() => {
      first.result.current.mutate(1);
    });
    await waitFor(() => expect(client.getQueryData(['count'])).toBe(1));

    act(() => {
      second.result.current.mutate(10);
    });
    await waitFor(() => expect(client.getQueryData(['count'])).toBe(11)); // second applied over the first's patch

    // The second fails → restores ITS snapshot: the first's optimistic value, not the origin.
    act(() => {
      d2.reject(new Error('second fails'));
    });
    await waitFor(() => expect(client.getQueryData(['count'])).toBe(1));

    // The first fails → unwinds to the origin.
    act(() => {
      d1.reject(new Error('first fails'));
    });
    await waitFor(() => expect(client.getQueryData(['count'])).toBe(0));
  });

  it('composes with defineEndpoint — a def as the target key patches the def entry, settle refetches truth', async () => {
    const client = createTestQueryClient();
    const queryFn = vi.fn(async (): Promise<CodeDto[]> => [{ id: 'a' }, { id: 'b' }]);
    const list = (q?: string) => defineEndpoint({ key: ['codes', 'list', q ?? ''] as const, queryFn });
    const def = list();
    const d = deferred<null>();

    const { result } = renderHook(
      () => ({
        query: useAppQuery({ ...def }),
        remove: useOptimisticMutation<null, { id: string }>({
          mutationFn: () => d.promise,
          targets: [
            {
              key: def,
              apply: (codes: readonly CodeDto[] | undefined, vars) =>
                (codes ?? []).filter((code) => code.id !== vars.id),
            },
          ],
        }),
      }),
      { wrapper: createQueryWrapper(client) },
    );

    await waitFor(() => expect(result.current.query.data).toEqual([{ id: 'a' }, { id: 'b' }]));

    act(() => {
      result.current.remove.mutate({ id: 'a' });
    });

    // The live query keyed by the def sees the patch immediately.
    await waitFor(() => expect(result.current.query.data).toEqual([{ id: 'b' }]));
    expect(client.getQueryData(def.key)).toEqual([{ id: 'b' }]);

    await act(async () => {
      d.resolve(null);
      await d.promise;
    });

    // Settle invalidates the def key → the active query refetches the server truth.
    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.query.data).toEqual([{ id: 'a' }, { id: 'b' }]));
  });

  it('cancels in-flight target queries so a late response cannot clobber the patch', async () => {
    const client = createTestQueryClient();
    const cancel = vi.spyOn(client, 'cancelQueries');
    const fetch = deferred<readonly CodeDto[]>();
    const d = deferred<null>();

    // A live query mid-flight on the target key.
    const query = renderHook(
      () => useAppQuery<readonly CodeDto[]>({ key: ['codes', 'list'], queryFn: () => fetch.promise }),
      { wrapper: createQueryWrapper(client) },
    );
    await waitFor(() => expect(query.result.current.loading).toBe(true));

    const { result } = renderHook(
      () =>
        useOptimisticMutation<null, { id: string }>({
          mutationFn: () => d.promise,
          targets: [removeCodeTarget()],
          invalidateOnSettle: false,
        }),
      { wrapper: createQueryWrapper(client) },
    );

    act(() => {
      result.current.mutate({ id: 'a' });
    });

    await waitFor(() => expect(cancel).toHaveBeenCalledWith({ queryKey: ['codes', 'list'] }));
    // Nothing was cached yet, so the patch seeds the entry from `undefined`.
    await waitFor(() => expect(client.getQueryData(['codes', 'list'])).toEqual([]));

    // The cancelled fetch resolving late is discarded — the patch stays.
    await act(async () => {
      fetch.resolve([{ id: 'a' }, { id: 'b' }]);
      await fetch.promise;
    });
    expect(client.getQueryData(['codes', 'list'])).toEqual([]);

    await act(async () => {
      d.resolve(null);
      await d.promise;
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('rollback removes a seeded entry (no snapshot to restore) instead of leaving phantom data', async () => {
    const client = createTestQueryClient();
    const d = deferred<null>();

    const { result } = renderHook(
      () =>
        useOptimisticMutation<null, { id: string }>({
          mutationFn: () => d.promise,
          targets: [
            {
              key: ['codes', 'list'],
              apply: (codes: readonly CodeDto[] | undefined, vars) => [...(codes ?? []), { id: vars.id }],
            },
          ],
        }),
      { wrapper: createQueryWrapper(client) },
    );

    act(() => {
      result.current.mutate({ id: 'new' });
    });
    await waitFor(() => expect(client.getQueryData(['codes', 'list'])).toEqual([{ id: 'new' }]));

    act(() => {
      d.reject(new ApiError(500, null, 'boom'));
    });

    await waitFor(() => expect(result.current.error?.status).toBe(500));
    expect(client.getQueryData(['codes', 'list'])).toBeUndefined();
    expect(client.getQueryCache().find({ queryKey: ['codes', 'list'] })).toBeUndefined(); // entry gone, not `undefined`-valued
  });

  it('invalidateOnSettle: false keeps the patch without reconciling', async () => {
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    client.setQueryData(['count'], 1);

    const { result } = renderHook(
      () =>
        useOptimisticMutation<null, number>({
          mutationFn: async () => null,
          targets: [{ key: ['count'], apply: (count: number | undefined, delta: number) => (count ?? 0) + delta }],
          invalidateOnSettle: false,
        }),
      { wrapper: createQueryWrapper(client) },
    );

    await act(async () => {
      await result.current.mutateAsync(4);
    });

    expect(client.getQueryData(['count'])).toBe(5);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
