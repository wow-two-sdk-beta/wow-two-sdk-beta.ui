import { useMemo } from 'react';
import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';

import type { ApiError } from '../foundation/http';

import type { AppQueryMeta } from './CreateQueryClient';
import { toApiError } from './ToApiError';

/** Defines options for `useAppPaginatedQuery`. */
export interface UseAppPaginatedQueryOptions<TItem, TPage> {
  /** The base React Query cache key (from `queryKeys`) — the active `page` is appended to form the per-page key. */
  readonly key: QueryKey;

  /** Fetches one page; receives the controlled `page` and the RQ `AbortSignal`. */
  readonly queryFn: (ctx: { page: number; signal: AbortSignal }) => Promise<TPage>;

  /** The controlled page index — the caller owns it; changing it loads that page. */
  readonly page: number;

  /** Extracts items from a page — the page itself is the item array when omitted. */
  readonly mapPage?: (page: TPage) => readonly TItem[];

  /** Gates the query — skips fetching while `false`. */
  readonly enabled?: boolean;

  /** Metadata surfaced to the global `onError` seam — `suppressGlobalError: true` keeps this query's failures out of it. */
  readonly meta?: AppQueryMeta;
}

/** Manages page/offset pagination — wraps RQ `useQuery` with `keepPreviousData` so the list holds steady between pages. */
export function useAppPaginatedQuery<TItem, TPage>({
  key,
  queryFn,
  page,
  mapPage,
  enabled,
  meta,
}: UseAppPaginatedQueryOptions<TItem, TPage>) {
  const query = useQuery<TPage, Error, TPage, QueryKey>({
    queryKey: [...key, page],
    queryFn: ({ signal }) => queryFn({ page, signal }),
    placeholderData: keepPreviousData,
    enabled,
    meta,
  });

  const items = useMemo<readonly TItem[]>(() => {
    if (query.data === undefined) return [];
    return mapPage ? mapPage(query.data) : (query.data as unknown as readonly TItem[]);
  }, [query.data, mapPage]);

  const error: ApiError | null = query.error ? toApiError(query.error) : null;

  return {
    items,
    // The raw page as fetched (`TPage`) — total count / page count / `hasMore` live here; `undefined`
    // until the first page resolves. While `isPlaceholder`, it is the held previous page.
    page: query.data,
    loading: query.isPending && query.isFetching,
    error,
    isPlaceholder: query.isPlaceholderData,
    refetch: query.refetch,
  };
}
