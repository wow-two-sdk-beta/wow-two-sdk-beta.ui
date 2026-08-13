import { shallowRef, toValue, type MaybeRefOrGetter, type Ref } from 'vue';
import { useQueryClient, type QueryKey } from '@tanstack/vue-query';

import type { ApiError } from '../foundation/http';

import type { AppQueryMeta } from './CreateQueryClient';
import { toApiError } from './ToApiError';

/** Defines options for `useAppLazyQuery` — `TRaw` first so it infers from `queryFn` (a spread def) and `TData` defaults to it when `map` is absent. */
export interface UseAppLazyQueryOptions<TRaw, TData = TRaw> {
  /** The cache key (from `queryKeys`) — read at each `fetch()`, so a ref or getter re-keys the next call. */
  readonly key: MaybeRefOrGetter<QueryKey>;

  /** Fetches the raw payload; receives the `AbortSignal`. */
  readonly queryFn: (ctx: { signal: AbortSignal }) => Promise<TRaw>;

  /** Maps the raw payload to the domain shape — identity when omitted. */
  readonly map?: (raw: TRaw) => TData;

  /** Metadata surfaced to the global `onError` seam — `suppressGlobalError: true` keeps this query's failures out of it. */
  readonly meta?: AppQueryMeta;
}

/** Represents an imperative query's slice — state as refs, plus the two commands. */
export interface UseAppLazyQueryReturn<TData> {
  /** The mapped payload from the latest settled `fetch()`, or `undefined` while idle. */
  readonly data: Ref<TData | undefined>;

  /** True while a `fetch()` is in flight. */
  readonly loading: Ref<boolean>;

  /** The latest failure coerced to `ApiError`, or `null`. */
  readonly error: Ref<ApiError | null>;

  /** Runs the request on demand; resolves the mapped data and rejects with the raw error. */
  readonly fetch: () => Promise<TData>;

  /** Returns the hook to its idle state and orphans any in-flight call. */
  readonly reset: () => void;
}

/**
 * Manages an imperative query — does not fetch on mount; `fetch()` runs the request on demand,
 * caching by key via the client (which dedupes concurrent calls and serves a still-fresh cache entry
 * without refetching — the client's `staleTime` window applies). Drives local `data`/`loading`/`error`
 * state with latest-call-wins semantics: a slower earlier `fetch()` (or one orphaned by `reset`) never
 * overwrites newer state, though every call's promise still settles with its own outcome. `fetch()`
 * resolves the mapped data and rejects with the raw error, while `error` holds the coerced `ApiError`.
 * For fetch-on-submit / export-on-click flows. `reset` returns it to the idle state.
 */
export function useAppLazyQuery<TRaw, TData = TRaw>({
  key,
  queryFn,
  map,
  meta,
}: UseAppLazyQueryOptions<TRaw, TData>): UseAppLazyQueryReturn<TData> {
  const client = useQueryClient();

  const data = shallowRef<TData | undefined>(undefined);
  const loading = shallowRef(false);
  const error = shallowRef<ApiError | null>(null);

  // Sequences fetches so only the LATEST call writes state — a slow earlier fetch (or one orphaned
  // by `reset`) settling late must not clobber newer data or resurrect a reset hook. The returned
  // promise still resolves/rejects with its own outcome for every caller. A plain local: never
  // rendered, so reactivity would be waste.
  let sequence = 0;

  const fetch = async (): Promise<TData> => {
    const current = ++sequence;
    loading.value = true;
    error.value = null;
    try {
      const raw = await client.fetchQuery<TRaw, Error, TRaw, QueryKey>({
        queryKey: toValue(key),
        queryFn: ({ signal }) => queryFn({ signal }),
        meta,
      });
      const mapped = map ? map(raw) : (raw as unknown as TData);
      if (current === sequence) {
        data.value = mapped;
        loading.value = false;
      }
      return mapped;
    } catch (caught) {
      if (current === sequence) {
        error.value = toApiError(caught);
        loading.value = false;
      }
      throw caught;
    }
  };

  const reset = (): void => {
    sequence += 1; // orphan any in-flight fetch — its late settle no longer writes state
    data.value = undefined;
    error.value = null;
    loading.value = false;
  };

  return { data, loading, error, fetch, reset };
}
