import { useSuspenseQuery, type QueryKey } from '@tanstack/react-query';

import type { AppQueryMeta } from './CreateQueryClient';

/** Defines a suspenseful query — a key, a fetcher, and an optional raw→view mapper. `TRaw` first so it infers from `queryFn` (a spread def); `TData` defaults to it when `map` is absent. */
export interface AppSuspenseQueryOptions<TRaw, TData = TRaw> {
  /** The query key that identifies and caches this query. */
  readonly key: QueryKey;

  /** Fetches the raw data; receives the abort signal React Query manages. */
  readonly queryFn: (context: { signal: AbortSignal }) => Promise<TRaw>;

  /** Maps the raw fetched shape to the view shape; identity when omitted. */
  readonly map?: (raw: TRaw) => TData;

  /** Metadata surfaced to the global `onError` seam — `suppressGlobalError: true` keeps this query's failures out of it (boundary-handled errors would otherwise double-surface). */
  readonly meta?: AppQueryMeta;
}

/**
 * Manages a suspenseful query — suspends until data resolves, then surfaces it synchronously.
 * The caller must wrap it in a `<Suspense>` boundary (loading) and an error boundary (failure);
 * errors bubble straight past this hook. Pairs with the router's lazy routes.
 */
export function useAppSuspenseQuery<TRaw, TData = TRaw>({
  key,
  queryFn,
  map,
  meta,
}: AppSuspenseQueryOptions<TRaw, TData>) {
  const { data, refetch } = useSuspenseQuery<TRaw, Error, TData, QueryKey>({
    queryKey: key,
    queryFn,
    select: map,
    meta,
  });

  return { data, refetch };
}
