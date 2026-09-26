import { StrictMode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useRefresh } from '@src/query/UseRefresh';

describe('useRefresh', () => {
  it('stays refreshing for the minimum duration even when the refetch is instant', async () => {
    const refetch = vi.fn(async () => 'fresh');
    const { result } = renderHook(() => useRefresh(refetch, { minDuration: 60 }));

    let settled: Promise<void> = Promise.resolve();
    act(() => {
      settled = result.current.refresh();
    });
    expect(result.current.refreshing).toBe(true);
    expect(refetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(result.current.refreshing).toBe(true); // refetch done, minimum not yet

    await act(async () => {
      await settled;
    });
    expect(result.current.refreshing).toBe(false);
  });

  it('waits for a slow refetch past the minimum', async () => {
    let finish!: () => void;
    const refetch = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useRefresh(refetch, { minDuration: 10 }));

    let settled: Promise<void> = Promise.resolve();
    act(() => {
      settled = result.current.refresh();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(result.current.refreshing).toBe(true);

    await act(async () => {
      finish();
      await settled;
    });
    expect(result.current.refreshing).toBe(false);
  });

  it('keeps one pending state across overlapping clicks and survives a failed refetch', async () => {
    const refetch = vi.fn(async () => {
      throw new Error('offline');
    });
    const { result } = renderHook(() => useRefresh(refetch, { minDuration: 20 }));

    let first: Promise<void> = Promise.resolve();
    let second: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.refresh();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      second = result.current.refresh();
      await first;
    });
    expect(result.current.refreshing).toBe(true); // the second click is still pending

    await act(async () => {
      await second;
    });
    expect(result.current.refreshing).toBe(false);
  });
  it('settles under StrictMode, which mounts, unmounts and mounts again', async () => {
    const refetch = vi.fn(async () => 'fresh');
    const { result } = renderHook(() => useRefresh(refetch, { minDuration: 10 }), { wrapper: StrictMode });

    let settled: Promise<void> = Promise.resolve();
    act(() => {
      settled = result.current.refresh();
    });
    expect(result.current.refreshing).toBe(true);

    await act(async () => {
      await settled;
    });
    expect(result.current.refreshing).toBe(false);
  });
});
