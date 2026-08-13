import { computed, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue';
import { useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/vue-query';

import type { ApiError } from '../foundation/http';

import type { AppQueryMeta } from './CreateQueryClient';
import { toApiError } from './ToApiError';

/** Defines options for `useAppInfiniteQuery`. */
export interface UseAppInfiniteQueryOptions<TItem, TPage> {
  /** The cache key (from `queryKeys`). */
  readonly key: MaybeRefOrGetter<QueryKey>;

  /** Fetches one page for `pageParam`; receives the `AbortSignal`. */
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
  readonly enabled?: MaybeRefOrGetter<boolean>;

  /** Metadata surfaced to the global `onError` seam — `suppressGlobalError: true` keeps this query's failures out of it (e.g. polls that would otherwise toast per failed refetch). */
  readonly meta?: AppQueryMeta;
}

/** Represents an infinite query's slice — every member reactive. */
export interface UseAppInfiniteQueryReturn<TItem> {
  /** Every fetched page flattened to items. */
  readonly items: ComputedRef<readonly TItem[]>;

  /** True while there is no page yet and a fetch is in flight. */
  readonly loading: ComputedRef<boolean>;

  /** The failure coerced to `ApiError`, or `null`. */
  readonly error: ComputedRef<ApiError | null>;

  /** Whether another page can be fetched. */
  readonly hasNextPage: Ref<boolean>;

  /** Fetches the next page. */
  readonly fetchNextPage: (...args: never[]) => unknown;

  /** True while the next page is in flight. */
  readonly isFetchingNextPage: Ref<boolean>;

  /** Refetches every fetched page. */
  readonly refetch: () => unknown;
}

/** Manages a paginated resource — wraps `useInfiniteQuery`, flattens pages to items, and supports poll-while-running. */
export function useAppInfiniteQuery<TItem, TPage>({
  key,
  queryFn,
  getNextPageParam,
  initialPageParam,
  mapPage,
  refetchInterval,
  enabled,
  meta,
}: UseAppInfiniteQueryOptions<TItem, TPage>): UseAppInfiniteQueryReturn<TItem> {
  // React memoized this with `useCallback` so the `useMemo` below did not re-run each render; Vue
  // recomputes only when a tracked dependency changes, so a plain closure is enough.
  const extract = (page: TPage): readonly TItem[] =>
    mapPage ? mapPage(page) : (page as unknown as readonly TItem[]);

  const query = useInfiniteQuery<TPage, Error, InfiniteData<TPage, unknown>, QueryKey, unknown>(() => ({
    queryKey: toValue(key),
    queryFn: ({ pageParam, signal }) => queryFn({ pageParam, signal }),
    getNextPageParam,
    initialPageParam,
    enabled: toValue(enabled),
    meta,
    refetchInterval:
      refetchInterval === undefined
        ? undefined
        : (query_) => {
            if (typeof refetchInterval === 'number') return refetchInterval;
            const current = (query_.state.data?.pages ?? []).flatMap((page) => [...extract(page)]);
            return refetchInterval(current);
          },
  }));

  return {
    items: computed(() => (query.data.value?.pages ?? []).flatMap((page) => [...extract(page)])),
    loading: computed(() => query.isPending.value && query.isFetching.value),
    error: computed(() => (query.error.value ? toApiError(query.error.value) : null)),
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
