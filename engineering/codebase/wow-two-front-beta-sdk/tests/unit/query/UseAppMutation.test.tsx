import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ApiError } from '@src/foundation/http';

import { useAppMutation } from '@src/query/UseAppMutation';

// Local, isolated client per test tree — no retries (fail fast) and no gc (state survives assertions).
function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

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

describe('useAppMutation', () => {
  it('is passive — data appears only after resolve, then invalidates + reconciles', async () => {
    const { client, wrapper } = createWrapper();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const onConfirmed = vi.fn();
    const d = deferred<{ id: string }>();

    const { result } = renderHook(
      () =>
        useAppMutation<{ id: string }, { name: string }>({
          mutationFn: () => d.promise,
          invalidates: (_vars, data) => [['projects'], ['projects', 'detail', data.id]],
          onConfirmed,
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ name: 'x' });
    });

    // No optimism: nothing is written before the server confirms.
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(invalidate).not.toHaveBeenCalled();
    expect(onConfirmed).not.toHaveBeenCalled();

    await act(async () => {
      d.resolve({ id: '42' });
      await d.promise;
    });

    // Reconcile happens only on the confirmed server value.
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
    expect(result.current.data).toEqual({ id: '42' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['projects'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['projects', 'detail', '42'] });
    expect(onConfirmed).toHaveBeenCalledWith({ id: '42' }, { name: 'x' }, client);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('coerces a failed mutation to ApiError and leaves the cache untouched', async () => {
    const { client, wrapper } = createWrapper();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const onConfirmed = vi.fn();

    const { result } = renderHook(
      () =>
        useAppMutation<{ id: string }, void>({
          mutationFn: () => Promise.reject(new ApiError(422, null, 'bad')),
          invalidates: () => [['projects']],
          onConfirmed,
        }),
      { wrapper },
    );

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toBeInstanceOf(ApiError);
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.error?.status).toBe(422);
    expect(result.current.data).toBeUndefined();
    expect(invalidate).not.toHaveBeenCalled(); // failure → cache untouched
    expect(onConfirmed).not.toHaveBeenCalled();
  });

  it('reset clears data and error', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAppMutation<{ ok: boolean }, void>({ mutationFn: async () => ({ ok: true }) }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync();
    });
    await waitFor(() => expect(result.current.data).toEqual({ ok: true }));

    act(() => {
      result.current.reset();
    });
    await waitFor(() => expect(result.current.data).toBeUndefined());
    expect(result.current.error).toBeNull();
  });
});
