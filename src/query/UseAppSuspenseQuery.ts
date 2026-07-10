import { useSuspenseQuery, type QueryKey } from '@tanstack/react-query';

/** Defines a suspenseful query — a key, a fetcher, and an optional raw→view mapper. */
export interface AppSuspenseQueryOptions<TData, TRaw = TData> {
  /** The query key that identifies and caches this query. */
  readonly key: QueryKey;

  /** Fetches the raw data; receives the abort signal React Query manages. */
  readonly queryFn: (context: { signal: AbortSignal }) => Promise<TRaw>;

  /** Maps the raw fetched shape to the view shape; identity when omitted. */
  readonly map?: (raw: TRaw) => TData;
}

/**
 * Manages a suspenseful query — suspends until data resolves, then surfaces it synchronously.
 * The caller must wrap it in a `<Suspense>` boundary (loading) and an error boundary (failure);
 * errors bubble straight past this hook. Pairs with the router's lazy routes.
 */
export function useAppSuspenseQuery<TData, TRaw = TData>({
  key,
  queryFn,
  map,
}: AppSuspenseQueryOptions<TData, TRaw>) {
  const { data, refetch } = useSuspenseQuery<TRaw, Error, TData, QueryKey>({
    queryKey: key,
    queryFn,
    select: map,
  });

  return { data, refetch };
}
