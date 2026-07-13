import { useQuery, type QueryKey } from '@tanstack/react-query';

import type { ApiError } from '../foundation/http';

import type { AppQueryMeta } from './CreateQueryClient';
import { toApiError } from './ToApiError';

/** Defines options for `useAppQuery` — `TRaw` first so it infers from `queryFn` (a spread def) and `TData` defaults to it when `map` is absent. */
export interface UseAppQueryOptions<TRaw, TData = TRaw> {
  /** The React Query cache key (from `queryKeys`). */
  readonly key: QueryKey;

  /** Fetches the raw payload; receives the RQ `AbortSignal` so the request cancels on unmount. */
  readonly queryFn: (ctx: { signal: AbortSignal }) => Promise<TRaw>;

  /** Maps the raw payload to the domain shape — identity when omitted. */
  readonly map?: (raw: TRaw) => TData;

  /** Gates the query — skips fetching while `false`. */
  readonly enabled?: boolean;

  /** Metadata surfaced to the global `onError` seam — `suppressGlobalError: true` keeps this query's failures out of it. */
  readonly meta?: AppQueryMeta;
}

/** Manages a single-resource query — wraps RQ `useQuery`, maps raw→domain via `select`, and coerces failures to `ApiError`. */
export function useAppQuery<TRaw, TData = TRaw>({
  key,
  queryFn,
  map,
  enabled,
  meta,
}: UseAppQueryOptions<TRaw, TData>) {
  const query = useQuery<TRaw, Error, TData, QueryKey>({
    queryKey: key,
    queryFn: ({ signal }) => queryFn({ signal }),
    select: map ?? ((raw: TRaw) => raw as unknown as TData),
    enabled,
    meta,
  });

  const error: ApiError | null = query.error ? toApiError(query.error) : null;

  return {
    data: query.data,
    loading: query.isPending && query.isFetching,
    error,
    refetch: query.refetch,
  };
}
