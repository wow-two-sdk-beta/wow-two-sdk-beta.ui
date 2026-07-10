import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ApiError } from '../foundation/http';

import { createQueryWrapper } from './QueryTestUtils';
import { useAppLazyQuery } from './UseAppLazyQuery';

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
      () => useAppLazyQuery<number, { n: number }>({ key: ['lazy', 'ok'], queryFn, map: (raw) => raw.n * 10 }),
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
