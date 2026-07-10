import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query';

import type { ApiError } from '../foundation/http';

import { toApiError } from './ToApiError';

/** Defines options for `useAppInfiniteQuery`. */
export interface UseAppInfiniteQueryOptions<TItem, TPage> {
  /** The React Query cache key (from `queryKeys`). */
  readonly key: QueryKey;

  /** Fetches one page for `pageParam`; receives the RQ `AbortSignal`. */
  readonly queryFn: (ctx: { pageParam: unknown; signal: AbortSignal }) => Promise<TPage>;

  /** Derives the next page's param from the last page — return `undefined`/`null` to stop. */
  readonly getNextPageParam: (lastPage: TPage, allPages: readonly TPage[]) => unknown;

  /** The param for the first page. */
  readonly initialPageParam: unknown;

  /** Extracts items from a page — the page itself is the item array when omitted. */
  readonly mapPage?: (page: TPage) => readonly TItem[];

  /** Poll interval in ms, or a fn of the current items → ms / `false` (poll-while-running). */
  readonly refetchInterval?: number | ((items: readonly TItem[]) => number | false);

  /** Gates the query — skips fetching while `false`. */
  readonly enabled?: boolean;
}

/** Manages a paginated resource — wraps RQ `useInfiniteQuery`, flattens pages to items, and supports poll-while-running. */
export function useAppInfiniteQuery<TItem, TPage>({
  key,
  queryFn,
  getNextPageParam,
  initialPageParam,
  mapPage,
  refetchInterval,
  enabled,
}: UseAppInfiniteQueryOptions<TItem, TPage>) {
  const extract = useCallback(
    (page: TPage): readonly TItem[] => (mapPage ? mapPage(page) : (page as unknown as readonly TItem[])),
    [mapPage],
  );

  const query = useInfiniteQuery<TPage, Error, InfiniteData<TPage, unknown>, QueryKey, unknown>({
    queryKey: key,
    queryFn: ({ pageParam, signal }) => queryFn({ pageParam, signal }),
    getNextPageParam,
    initialPageParam,
    enabled,
    refetchInterval:
      refetchInterval === undefined
        ? undefined
        : (q) => {
            if (typeof refetchInterval === 'number') return refetchInterval;
            const current = (q.state.data?.pages ?? []).flatMap((page) => [...extract(page)]);
            return refetchInterval(current);
          },
  });

  const items = useMemo<TItem[]>(
    () => (query.data?.pages ?? []).flatMap((page) => [...extract(page)]),
    [query.data, extract],
  );

  const error: ApiError | null = query.error ? toApiError(query.error) : null;

  return {
    items,
    loading: query.isPending && query.isFetching,
    error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
