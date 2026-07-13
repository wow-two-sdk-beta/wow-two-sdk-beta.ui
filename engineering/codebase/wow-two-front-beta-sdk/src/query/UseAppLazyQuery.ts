import { useCallback, useRef, useState } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import type { ApiError } from '../foundation/http';

import type { AppQueryMeta } from './CreateQueryClient';
import { toApiError } from './ToApiError';

/** Defines options for `useAppLazyQuery` — `TRaw` first so it infers from `queryFn` (a spread def) and `TData` defaults to it when `map` is absent. */
export interface UseAppLazyQueryOptions<TRaw, TData = TRaw> {
  /** The React Query cache key (from `queryKeys`). */
  readonly key: QueryKey;

  /** Fetches the raw payload; receives the RQ `AbortSignal`. */
  readonly queryFn: (ctx: { signal: AbortSignal }) => Promise<TRaw>;

  /** Maps the raw payload to the domain shape — identity when omitted. */
  readonly map?: (raw: TRaw) => TData;

  /** Metadata surfaced to the global `onError` seam — `suppressGlobalError: true` keeps this query's failures out of it. */
  readonly meta?: AppQueryMeta;
}

/**
 * Manages an imperative query — does not fetch on mount; `fetch()` runs the request on demand,
 * caching by key via the client (which dedupes concurrent calls and serves a still-fresh cache
 * entry without refetching — the client's `staleTime` window applies). Drives local
 * `data`/`loading`/`error` state with latest-call-wins semantics: a slower earlier `fetch()` (or one
 * orphaned by `reset`) never overwrites newer state, though every call's promise still settles with
 * its own outcome. `fetch()` resolves the mapped data and rejects with the raw error, while `error`
 * holds the coerced `ApiError`. For fetch-on-submit / export-on-click flows. `reset` returns it to
 * the idle state.
 */
export function useAppLazyQuery<TRaw, TData = TRaw>({
  key,
  queryFn,
  map,
  meta,
}: UseAppLazyQueryOptions<TRaw, TData>) {
  const client = useQueryClient();

  const [data, setData] = useState<TData | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Sequences fetches so only the LATEST call writes state — a slow earlier fetch (or one
  // orphaned by `reset`) settling late must not clobber newer data or resurrect a reset hook.
  // The returned promise still resolves/rejects with its own outcome for every caller.
  const sequenceRef = useRef(0);

  const fetch = useCallback(async (): Promise<TData> => {
    const sequence = ++sequenceRef.current;
    setLoading(true);
    setError(null);
    try {
      const raw = await client.fetchQuery<TRaw, Error, TRaw, QueryKey>({
        queryKey: key,
        queryFn: ({ signal }) => queryFn({ signal }),
        meta,
      });
      const mapped = map ? map(raw) : (raw as unknown as TData);
      if (sequence === sequenceRef.current) {
        setData(mapped);
        setLoading(false);
      }
      return mapped;
    } catch (caught) {
      if (sequence === sequenceRef.current) {
        setError(toApiError(caught));
        setLoading(false);
      }
      throw caught;
    }
  }, [client, key, queryFn, map, meta]);

  const reset = useCallback((): void => {
    sequenceRef.current += 1; // orphan any in-flight fetch — its late settle no longer writes state
    setData(undefined);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, fetch, reset };
}
