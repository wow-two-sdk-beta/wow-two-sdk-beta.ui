import { computed, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue';
import { useQuery, type QueryKey } from '@tanstack/vue-query';

import type { ApiError } from '../foundation/http';

import type { AppQueryMeta } from './CreateQueryClient';
import { toApiError } from './ToApiError';

/** Defines options for `useAppQuery` — `TRaw` first so it infers from `queryFn` (a spread def) and `TData` defaults to it when `map` is absent. */
export interface UseAppQueryOptions<TRaw, TData = TRaw> {
  /** The cache key (from `queryKeys`). A ref or getter re-keys the query reactively — React re-ran the hook instead. */
  readonly key: MaybeRefOrGetter<QueryKey>;

  /** Fetches the raw payload; receives the `AbortSignal` so the request cancels on unmount. */
  readonly queryFn: (ctx: { signal: AbortSignal }) => Promise<TRaw>;

  /** Maps the raw payload to the domain shape — identity when omitted. */
  readonly map?: (raw: TRaw) => TData;

  /** Gates the query — skips fetching while `false`. A ref or getter toggles it reactively. */
  readonly enabled?: MaybeRefOrGetter<boolean>;

  /** Metadata surfaced to the global `onError` seam — `suppressGlobalError: true` keeps this query's failures out of it. */
  readonly meta?: AppQueryMeta;
}

/** Represents a single-resource query's slice — every member reactive. */
export interface UseAppQueryReturn<TData> {
  /** The mapped domain payload, or `undefined` until it resolves. */
  readonly data: Ref<TData | undefined>;

  /** True while there is no data yet and a fetch is in flight. */
  readonly loading: ComputedRef<boolean>;

  /** The failure coerced to `ApiError`, or `null`. */
  readonly error: ComputedRef<ApiError | null>;

  /** Refetches the query. */
  readonly refetch: () => unknown;
}

/**
 * Manages a single-resource query — wraps `useQuery`, maps raw→domain via `select`, and coerces
 * failures to `ApiError`.
 *
 * Returns REFS, not values: `@tanstack/vue-query` hands back a ref per field, and a composable that
 * unwrapped them would freeze at the first render. Read `data.value` (or bind `data` in a template).
 */
export function useAppQuery<TRaw, TData = TRaw>({
  key,
  queryFn,
  map,
  enabled,
  meta,
}: UseAppQueryOptions<TRaw, TData>): UseAppQueryReturn<TData> {
  // A getter for the WHOLE options object: `key` and `enabled` are `MaybeRefOrGetter`, and this is
  // the one form that re-evaluates every one of them together on each dependency change.
  const query = useQuery<TRaw, Error, TData, QueryKey>(() => ({
    queryKey: toValue(key),
    queryFn: ({ signal }) => queryFn({ signal }),
    select: map ?? ((raw: TRaw) => raw as unknown as TData),
    enabled: toValue(enabled),
    meta,
  }));

  return {
    data: query.data,
    loading: computed(() => query.isPending.value && query.isFetching.value),
    error: computed(() => (query.error.value ? toApiError(query.error.value) : null)),
    refetch: query.refetch,
  };
}
