import { useCallback, useState } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import type { ApiError } from '../foundation/http';

import { toApiError } from './ToApiError';

/** Defines options for `useAppLazyQuery`. */
export interface UseAppLazyQueryOptions<TData, TRaw = TData> {
  /** The React Query cache key (from `queryKeys`). */
  readonly key: QueryKey;

  /** Fetches the raw payload; receives the RQ `AbortSignal`. */
  readonly queryFn: (ctx: { signal: AbortSignal }) => Promise<TRaw>;

  /** Maps the raw payload to the domain shape — identity when omitted. */
  readonly map?: (raw: TRaw) => TData;
}

/**
 * Manages an imperative query — does not fetch on mount; `fetch()` runs the request on demand,
 * caching by key via the client (which dedupes concurrent calls). Drives local `data`/`loading`/`error`
 * state: `fetch()` resolves the mapped data and rejects with the raw error, while `error` holds the
 * coerced `ApiError`. For fetch-on-submit / export-on-click flows. `reset` returns it to the idle state.
 */
export function useAppLazyQuery<TData, TRaw = TData>({
  key,
  queryFn,
  map,
}: UseAppLazyQueryOptions<TData, TRaw>) {
  const client = useQueryClient();

  const [data, setData] = useState<TData | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetch = useCallback(async (): Promise<TData> => {
    setLoading(true);
    setError(null);
    try {
      const raw = await client.fetchQuery<TRaw, Error, TRaw, QueryKey>({
        queryKey: key,
        queryFn: ({ signal }) => queryFn({ signal }),
      });
      const mapped = map ? map(raw) : (raw as unknown as TData);
      setData(mapped);
      return mapped;
    } catch (caught) {
      setError(toApiError(caught));
      throw caught;
    } finally {
      setLoading(false);
    }
  }, [client, key, queryFn, map]);

  const reset = useCallback((): void => {
    setData(undefined);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, fetch, reset };
}
