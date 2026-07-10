import { useMemo } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

/** Defines a prefetch target for the query cache — a key paired with its fetcher. */
export interface QueryCachePrefetch {
  /** The query key to warm — the same key the live query reads. */
  readonly key: QueryKey;

  /** Fetches the data to cache; receives the RQ `AbortSignal`. */
  readonly queryFn: (ctx: { signal: AbortSignal }) => Promise<unknown>;
}

/** Defines the imperative cache accessor returned by `useQueryCache`. */
export interface QueryCacheApi {
  /** Reads the cached value at `key`, or `undefined` when absent. */
  readonly get: <TData>(key: QueryKey) => TData | undefined;

  /** Writes `key` — a value, or an updater `(previous) => next` (React Query setter form). */
  readonly set: <TData>(key: QueryKey, data: TData | ((previous: TData | undefined) => TData)) => void;

  /** Marks the queries under `key` stale and refetches the active ones. */
  readonly invalidate: (key: QueryKey) => Promise<void>;

  /** Removes the queries under `key` from the cache. */
  readonly remove: (key: QueryKey) => void;

  /** Warms `key` in the background — React Query dedupes against a live query. */
  readonly prefetch: (target: QueryCachePrefetch) => Promise<void>;
}

/** Provides access to the React Query cache — imperative get/set/invalidate/remove/prefetch by key, wrapping the active `QueryClient`. */
export function useQueryCache(): QueryCacheApi {
  const client = useQueryClient();

  return useMemo<QueryCacheApi>(
    () => ({
      get: <TData>(key: QueryKey): TData | undefined => client.getQueryData<TData>(key),
      set: <TData>(key: QueryKey, data: TData | ((previous: TData | undefined) => TData)): void => {
        client.setQueryData<TData>(key, data);
      },
      invalidate: (key: QueryKey): Promise<void> => client.invalidateQueries({ queryKey: key }),
      remove: (key: QueryKey): void => {
        client.removeQueries({ queryKey: key });
      },
      prefetch: ({ key, queryFn }: QueryCachePrefetch): Promise<void> =>
        client.prefetchQuery({ queryKey: key, queryFn: ({ signal }) => queryFn({ signal }) }),
    }),
    [client],
  );
}
