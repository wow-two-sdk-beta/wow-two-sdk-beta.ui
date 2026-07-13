import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { ApiError } from '@src/foundation/http';

import { useAppInfiniteQuery } from '@src/query/UseAppInfiniteQuery';

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

afterEach(() => {
  // Clear any manual focus override set by the poll test.
  focusManager.setFocused(undefined);
});

describe('useAppInfiniteQuery', () => {
  it('flattens pages and paginates via fetchNextPage / hasNextPage', async () => {
    const byParam: Record<number, number[]> = { 0: [1, 2], 1: [3, 4] };
    const queryFn = vi.fn(({ pageParam }: { pageParam: unknown; signal: AbortSignal }) =>
      Promise.resolve(byParam[pageParam as number] ?? []),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useAppInfiniteQuery<number, number[]>({
          key: ['inf', 'flatten'],
          queryFn,
          initialPageParam: 0,
          getNextPageParam: (_last, all) => (all.length < 2 ? all.length : undefined),
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.items).toEqual([1, 2]));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.items).toEqual([1, 2, 3, 4]));
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('extracts items via mapPage', async () => {
    const queryFn = vi.fn(() => Promise.resolve({ rows: ['a', 'b'] }));
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useAppInfiniteQuery<string, { rows: string[] }>({
          key: ['inf', 'map'],
          queryFn,
          initialPageParam: 0,
          getNextPageParam: () => undefined,
          mapPage: (page) => page.rows,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.items).toEqual(['a', 'b']));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('polls while running via refetchInterval(items) and stops on false', async () => {
    focusManager.setFocused(true); // interval refetch only fires when focused
    let calls = 0;
    const queryFn = vi.fn(() => {
      calls += 1;
      return Promise.resolve([calls]);
    });
    const { wrapper } = createWrapper();
    renderHook(
      () =>
        useAppInfiniteQuery<number, number[]>({
          key: ['inf', 'poll'],
          queryFn,
          initialPageParam: 0,
          getNextPageParam: () => undefined,
          // keep polling until the latest item reaches 3, then stop
          refetchInterval: (items) => ((items[0] ?? 0) < 3 ? 10 : false),
        }),
      { wrapper },
    );

    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(3), { timeout: 2000 });

    // Interval returned false → no further fetches.
    const settled = queryFn.mock.calls.length;
    await new Promise((r) => setTimeout(r, 60));
    expect(queryFn.mock.calls.length).toBe(settled);
  });

  it('coerces infinite-query failures to ApiError', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useAppInfiniteQuery<number, number[]>({
          key: ['inf', 'err'],
          queryFn: () => Promise.reject(new ApiError(500, null, 'x')),
          initialPageParam: 0,
          getNextPageParam: () => undefined,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.error?.status).toBe(500);
    expect(result.current.items).toEqual([]);
  });
});
