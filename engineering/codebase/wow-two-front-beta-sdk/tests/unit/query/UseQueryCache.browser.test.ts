import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { createQueryWrapper, createTestQueryClient } from '@src/query/QueryTestUtils';
import { useQueryCache } from '@src/query/UseQueryCache';

describe('useQueryCache', () => {
  it('set then get round-trips a value, mirroring the client cache', () => {
    const client = createTestQueryClient();
    const { result } = renderHook(() => useQueryCache(), { wrapper: createQueryWrapper(client) });

    act(() => {
      result.current.set(['user', 1], { name: 'Ada' });
    });

    expect(result.current.get(['user', 1])).toEqual({ name: 'Ada' });
    expect(client.getQueryData(['user', 1])).toEqual({ name: 'Ada' });
  });

  it('set accepts an updater over the previous value', () => {
    const client = createTestQueryClient();
    const { result } = renderHook(() => useQueryCache(), { wrapper: createQueryWrapper(client) });

    act(() => {
      result.current.set<number>(['count'], 1);
      result.current.set<number>(['count'], (previous) => (previous ?? 0) + 4);
    });

    expect(result.current.get<number>(['count'])).toBe(5);
  });

  it('invalidate marks a cached query stale on the client', async () => {
    const client = createTestQueryClient();
    const { result } = renderHook(() => useQueryCache(), { wrapper: createQueryWrapper(client) });

    act(() => {
      result.current.set(['projects'], [{ id: 1 }]);
    });
    expect(client.getQueryState(['projects'])?.isInvalidated ?? false).toBe(false);

    await act(async () => {
      await result.current.invalidate(['projects']);
    });

    expect(client.getQueryState(['projects'])?.isInvalidated).toBe(true);
  });

  it('remove drops a cached entry from the client', () => {
    const client = createTestQueryClient();
    const { result } = renderHook(() => useQueryCache(), { wrapper: createQueryWrapper(client) });

    act(() => {
      result.current.set(['doomed'], { v: 1 });
    });
    expect(client.getQueryData(['doomed'])).toEqual({ v: 1 });

    act(() => {
      result.current.remove(['doomed']);
    });
    expect(client.getQueryData(['doomed'])).toBeUndefined();
  });

  it('prefetch populates the cache via the fetcher', async () => {
    const client = createTestQueryClient();
    const queryFn = vi.fn().mockResolvedValue({ id: 'abc' });
    const { result } = renderHook(() => useQueryCache(), { wrapper: createQueryWrapper(client) });

    await act(async () => {
      await result.current.prefetch({ key: ['transcript', 'abc'], queryFn });
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(client.getQueryData(['transcript', 'abc'])).toEqual({ id: 'abc' }));
  });

  it('returns a stable accessor across re-renders', () => {
    const client = createTestQueryClient();
    const { result, rerender } = renderHook(() => useQueryCache(), { wrapper: createQueryWrapper(client) });

    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});
