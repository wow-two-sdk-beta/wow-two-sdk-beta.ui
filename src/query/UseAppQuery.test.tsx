import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ApiError } from '../foundation/http';

import { createQueryClient } from './CreateQueryClient';
import { useAppQuery } from './UseAppQuery';

// Local, isolated client per test tree — no retries (fail fast) and no gc (state survives assertions).
function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
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

describe('useAppQuery', () => {
  it('returns mapped data and transitions loading → resolved', async () => {
    const d = deferred<{ n: number }>();
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAppQuery({ key: ['q', 'map'], queryFn: () => d.promise, map: (raw) => raw.n * 10 }),
      { wrapper },
    );

    // Pending: loading true, no data, no error.
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();

    await act(async () => {
      d.resolve({ n: 2 });
      await d.promise;
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(20); // map applied: 2 * 10
    expect(result.current.error).toBeNull();
  });

  it('is identity when map is omitted', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAppQuery({ key: ['q', 'identity'], queryFn: async () => ({ id: 'a' }) }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toEqual({ id: 'a' }));
  });

  it('passes an AbortSignal into queryFn', async () => {
    // Capture the signal directly — the SDK lints `after-used` (no `_`-arg escape) and forbids the
    // `spy.mock.calls[0][0]` index read under `noUncheckedIndexedAccess`.
    let received: AbortSignal | undefined;
    const spy = vi.fn((ctx: { signal: AbortSignal }) => {
      received = ctx.signal;
      return Promise.resolve('ok');
    });
    const { wrapper } = createWrapper();
    renderHook(() => useAppQuery({ key: ['q', 'signal'], queryFn: spy }), { wrapper });

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(received).toBeInstanceOf(AbortSignal);
  });

  it('enabled: false gates the fetch — no call, not loading', async () => {
    const queryFn = vi.fn(async () => 'never');
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useAppQuery({ key: ['q', 'gated'], queryFn, enabled }),
      { wrapper, initialProps: { enabled: false } },
    );

    // Gated: pending but not fetching → loading stays false, nothing fires.
    expect(queryFn).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.data).toBe('never'));
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('coerces an ApiError rejection, preserving status', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useAppQuery({
          key: ['q', 'apierr'],
          queryFn: () => Promise.reject(new ApiError(503, null, 'down')),
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.status).toBe(503);
    expect(result.current.data).toBeUndefined();
  });

  it('forwards meta to the client seam — suppressGlobalError keeps this query out of the global onError', async () => {
    const onError = vi.fn();
    const client = createQueryClient({ onError });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useAppQuery({
          key: ['q', 'meta-suppress'],
          queryFn: () => Promise.reject(new ApiError(404, null, 'missing')),
          meta: { suppressGlobalError: true },
        }),
      { wrapper },
    );

    // The hook still surfaces the coerced error locally — only the global seam stays quiet.
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(onError).not.toHaveBeenCalled();
  });

  it('wraps a non-ApiError rejection as status 0', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useAppQuery({
          key: ['q', 'plainerr'],
          queryFn: () => Promise.reject(new Error('nope')),
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.error?.status).toBe(0);
  });
});
