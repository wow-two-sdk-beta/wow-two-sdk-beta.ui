import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ApiError } from '@src/foundation/http';

import { createQueryWrapper } from '@src/query/QueryTestUtils';
import { useAppLazyQuery } from '@src/query/UseAppLazyQuery';

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

describe('useAppLazyQuery', () => {
  it('does not fetch until fetch() is called, then transitions loading and resolves mapped data', async () => {
    const d = deferred<{ n: number }>();
    const queryFn = vi.fn(() => d.promise);
    const { result } = renderHook(
      () => useAppLazyQuery<{ n: number }, number>({ key: ['lazy', 'ok'], queryFn, map: (raw) => raw.n * 10 }),
      { wrapper: createQueryWrapper() },
    );

    // Idle on mount — nothing fetched.
    expect(queryFn).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();

    // Trigger imperatively → loading true, still no data.
    let pending!: Promise<number>;
    act(() => {
      pending = result.current.fetch();
    });
    expect(queryFn).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.data).toBeUndefined();

    // Resolve → fetch() yields the mapped value, state settles.
    let resolved: number | undefined;
    await act(async () => {
      d.resolve({ n: 4 });
      resolved = await pending;
    });

    expect(resolved).toBe(40); // map applied: 4 * 10
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(40);
    expect(result.current.error).toBeNull();
  });

  it('is identity when map is omitted', async () => {
    const { result } = renderHook(
      () => useAppLazyQuery<{ id: string }>({ key: ['lazy', 'identity'], queryFn: async () => ({ id: 'a' }) }),
      { wrapper: createQueryWrapper() },
    );

    let resolved: { id: string } | undefined;
    await act(async () => {
      resolved = await result.current.fetch();
    });

    expect(resolved).toEqual({ id: 'a' });
    expect(result.current.data).toEqual({ id: 'a' });
  });

  it('coerces an ApiError rejection while fetch() rejects with the raw error', async () => {
    const raw = new ApiError(503, null, 'down');
    const { result } = renderHook(
      () => useAppLazyQuery<{ id: string }>({ key: ['lazy', 'apierr'], queryFn: () => Promise.reject(raw) }),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      await expect(result.current.fetch()).rejects.toBe(raw); // raw error propagates unchanged
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.error?.status).toBe(503);
    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it('wraps a non-ApiError rejection as status 0', async () => {
    const raw = new Error('nope');
    const { result } = renderHook(
      () => useAppLazyQuery<string>({ key: ['lazy', 'plainerr'], queryFn: () => Promise.reject(raw) }),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      await expect(result.current.fetch()).rejects.toBe(raw);
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.error?.status).toBe(0);
  });

  it('discards a late settle after reset — the orphaned fetch cannot resurrect state', async () => {
    const d = deferred<{ id: string }>();
    const { result } = renderHook(
      () => useAppLazyQuery<{ id: string }>({ key: ['lazy', 'reset-race'], queryFn: () => d.promise }),
      { wrapper: createQueryWrapper() },
    );

    let pending!: Promise<{ id: string }>;
    act(() => {
      pending = result.current.fetch();
    });
    await waitFor(() => expect(result.current.loading).toBe(true));

    act(() => {
      result.current.reset();
    });
    expect(result.current.loading).toBe(false);

    // The in-flight fetch settles late — its promise resolves for the caller, but state stays idle.
    let resolved: { id: string } | undefined;
    await act(async () => {
      d.resolve({ id: 'late' });
      resolved = await pending;
    });

    expect(resolved).toEqual({ id: 'late' });
    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('latest call wins — a slower earlier fetch (old key) cannot clobber newer data with a stale error', async () => {
    const slow = deferred<{ id: string }>();
    const { result, rerender } = renderHook(
      ({ which }: { which: 'a' | 'b' }) =>
        useAppLazyQuery<{ id: string }>({
          key: ['lazy', 'race', which],
          queryFn: which === 'a' ? () => slow.promise : async () => ({ id: 'b' }),
        }),
      { wrapper: createQueryWrapper(), initialProps: { which: 'a' as 'a' | 'b' } },
    );

    // First fetch on key A stays pending; the hook then re-points at key B and fetches again.
    let first!: Promise<{ id: string }>;
    act(() => {
      first = result.current.fetch();
    });
    rerender({ which: 'b' });
    await act(async () => {
      await result.current.fetch();
    });
    await waitFor(() => expect(result.current.data).toEqual({ id: 'b' }));

    // The stale key-A fetch fails late — its rejection reaches ITS caller, not the hook state.
    await act(async () => {
      slow.reject(new ApiError(500, null, 'stale failure'));
      await expect(first).rejects.toBeInstanceOf(ApiError);
    });

    expect(result.current.data).toEqual({ id: 'b' });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('reset clears data, error and loading', async () => {
    const { result } = renderHook(
      () => useAppLazyQuery<{ ok: boolean }>({ key: ['lazy', 'reset'], queryFn: async () => ({ ok: true }) }),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      await result.current.fetch();
    });
    await waitFor(() => expect(result.current.data).toEqual({ ok: true }));

    act(() => {
      result.current.reset();
    });
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
