import { computed, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue';
import { useQueries, type QueryKey, type QueryObserverResult } from '@tanstack/vue-query';

import type { ApiError } from '../foundation/http';

import { toApiError } from './ToApiError';

/** Defines one entry in a parallel `useAppQueries` batch — `TRaw` first so it infers from `queryFn` (a spread def) and `TData` defaults to it when `map` is absent. */
export interface AppQueriesEntry<TRaw, TData = TRaw> {
  /** The cache key (from `queryKeys`). */
  readonly key: QueryKey;

  /** Fetches this entry's raw payload; receives the `AbortSignal` so the request cancels on unmount. */
  readonly queryFn: (ctx: { signal: AbortSignal }) => Promise<TRaw>;

  /** Maps the raw payload to the domain shape — identity when omitted. */
  readonly map?: (raw: TRaw) => TData;
}

/** Represents one entry's slice of a `useAppQueries` batch. */
export interface AppQueryResult<TData> {
  /** The mapped domain payload, or `undefined` until this entry resolves. */
  readonly data: TData | undefined;

  /** True while this entry has no data yet and a fetch is in flight. */
  readonly loading: boolean;

  /** This entry's failure coerced to `ApiError`, or `null`. */
  readonly error: ApiError | null;
}

/** Defines options for `useAppQueries`. */
export interface UseAppQueriesOptions<TRaw, TData = TRaw> {
  /** The queries to run in parallel — the count may vary. A ref or getter re-builds the batch reactively. */
  readonly queries: MaybeRefOrGetter<readonly AppQueriesEntry<TRaw, TData>[]>;

  /** Gates the whole batch — skips fetching every entry while `false`. */
  readonly enabled?: MaybeRefOrGetter<boolean>;
}

/** Represents a parallel batch's aggregated slice — every member reactive. */
export interface UseAppQueriesReturn<TData> {
  /** One slice per entry, in the order they were given. */
  readonly results: ComputedRef<readonly AppQueryResult<TData>[]>;

  /** Just the payloads, positionally aligned with the entries. */
  readonly data: ComputedRef<readonly (TData | undefined)[]>;

  /** True while any entry is still loading. */
  readonly loading: ComputedRef<boolean>;

  /** Every entry's failure, coerced. */
  readonly errors: ComputedRef<readonly ApiError[]>;
}

/** Manages a dynamic batch of parallel queries — wraps `useQueries`, maps each raw→domain, and aggregates loading/errors. */
export function useAppQueries<TRaw, TData = TRaw>({
  queries,
  enabled,
}: UseAppQueriesOptions<TRaw, TData>): UseAppQueriesReturn<TData> {
  // `useQueries` types its result off a tuple of per-entry option types; a homogeneous, run-time
  // sized array cannot be expressed that way, so the result is asserted — the same widening the
  // React original applied to `UseQueryResult<TData, Error>[]`.
  const results = useQueries({
    queries: computed(() =>
      toValue(queries).map((entry) => ({
        queryKey: entry.key,
        queryFn: ({ signal }: { signal: AbortSignal }) => entry.queryFn({ signal }),
        select: entry.map ?? ((raw: TRaw) => raw as unknown as TData),
        enabled: toValue(enabled),
      })),
    ),
  }) as unknown as Ref<readonly QueryObserverResult<TData, Error>[]>;

  const mapped = computed<readonly AppQueryResult<TData>[]>(() =>
    results.value.map((query) => ({
      data: query.data,
      loading: query.isPending && query.isFetching,
      error: query.error ? toApiError(query.error) : null,
    })),
  );

  return {
    results: mapped,
    data: computed(() => mapped.value.map((result) => result.data)),
    loading: computed(() => mapped.value.some((result) => result.loading)),
    errors: computed(() => mapped.value.flatMap((result) => (result.error ? [result.error] : []))),
  };
}
