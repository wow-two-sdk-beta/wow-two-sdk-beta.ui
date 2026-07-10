import { useMemo } from 'react';
import { useQueries, type QueryKey, type UseQueryResult } from '@tanstack/react-query';

import type { ApiError } from '../foundation/http';

import { toApiError } from './ToApiError';

/** Defines one entry in a parallel `useAppQueries` batch — `TRaw` first so it infers from `queryFn` (a spread def) and `TData` defaults to it when `map` is absent. */
export interface AppQueriesEntry<TRaw, TData = TRaw> {
  /** The React Query cache key (from `queryKeys`). */
  readonly key: QueryKey;

  /** Fetches this entry's raw payload; receives the RQ `AbortSignal` so the request cancels on unmount. */
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
  /** The queries to run in parallel — the count may vary between renders. */
  readonly queries: readonly AppQueriesEntry<TRaw, TData>[];

  /** Gates the whole batch — skips fetching every entry while `false`. */
  readonly enabled?: boolean;
}

/** Manages a dynamic batch of parallel queries — wraps RQ `useQueries`, maps each raw→domain, and aggregates loading/errors. */
export function useAppQueries<TRaw, TData = TRaw>({
  queries,
  enabled,
}: UseAppQueriesOptions<TRaw, TData>) {
  const results = useQueries({
    queries: queries.map((entry) => ({
      queryKey: entry.key,
      queryFn: ({ signal }: { signal: AbortSignal }) => entry.queryFn({ signal }),
      select: entry.map ?? ((raw: TRaw) => raw as unknown as TData),
      enabled,
    })),
  }) as UseQueryResult<TData, Error>[];

  return useMemo(() => {
    const mapped: readonly AppQueryResult<TData>[] = results.map((query) => ({
      data: query.data,
      loading: query.isPending && query.isFetching,
      error: query.error ? toApiError(query.error) : null,
    }));

    return {
      results: mapped,
      data: mapped.map((result) => result.data) as readonly (TData | undefined)[],
      loading: mapped.some((result) => result.loading),
      errors: mapped.flatMap((result) => (result.error ? [result.error] : [])) as readonly ApiError[],
    };
  }, [results]);
}
