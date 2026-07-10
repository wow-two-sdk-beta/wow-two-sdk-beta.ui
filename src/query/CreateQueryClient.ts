import { CancelledError, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import type { ApiError } from '../foundation/http';

import { computeRetryDelay, DefaultRetryPolicy, shouldRetry, type RetryPolicy } from '../foundation/resilience';

import { toApiError } from './ToApiError';

const StaleTimeMs = 30_000;
const GcTimeMs = 5 * 60_000;

/**
 * Checks for a cancellation — RQ's own `CancelledError`, or the native `AbortError` a queryFn
 * rethrows when its signal aborts outside RQ (the transport client deliberately never wraps
 * aborts). A cancellation is intent, not failure: it must neither retry (`toApiError` maps it to
 * status `0`, which the transient set would otherwise retry) nor reach the global `onError` toast.
 */
function isCancellation(error: unknown): boolean {
  return error instanceof CancelledError || (error instanceof Error && error.name === 'AbortError');
}

/** The metadata bag a hook's `meta` option attaches to its query/mutation — free-form keys, read back by the global error seam. `suppressGlobalError: true` keeps that call's failures out of the global `onError` (per-query opt-out for polling / boundary-handled errors). */
export type AppQueryMeta = Record<string, unknown>;

/** Carries the failing query's / mutation's context into the global `onError`. */
export interface QueryErrorContext {
  /** The `meta` attached at the call site, or `undefined` when none was set. */
  readonly meta: AppQueryMeta | undefined;
}

/** Defines options for `createQueryClient`. */
export interface CreateQueryClientOptions {
  /** Emits a coerced `ApiError` whenever any query or mutation fails — wire a toast here. Cancellations (abort / RQ cancel) and calls whose `meta` sets `suppressGlobalError: true` are skipped; `context.meta` carries the call's `meta` for app-side filtering. */
  readonly onError?: (error: ApiError, context: QueryErrorContext) => void;

  /** The retry policy for transient query failures (backoff · jitter · retryable statuses). Default `DefaultRetryPolicy`. Mutations never retry; `onRetry` is transport-level only — the RQ retry seam has no pre-retry hook, so it is not invoked here. */
  readonly retry?: RetryPolicy;
}

/** Creates the app `QueryClient` — house defaults (30s stale · 5m gc · no focus-refetch · mutations no-retry) + a configurable `RetryPolicy` + global error coercion to `ApiError`. */
export function createQueryClient(options: CreateQueryClientOptions = {}): QueryClient {
  const handleError = (error: unknown, meta: AppQueryMeta | undefined): void => {
    if (isCancellation(error)) return;
    if (meta?.suppressGlobalError === true) return;
    options.onError?.(toApiError(error), { meta });
  };
  const policy = options.retry ?? DefaultRetryPolicy;

  return new QueryClient({
    queryCache: new QueryCache({ onError: (error, query) => handleError(error, query.meta) }),
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => handleError(error, mutation.meta),
    }),
    defaultOptions: {
      queries: {
        staleTime: StaleTimeMs,
        gcTime: GcTimeMs,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !isCancellation(error) && shouldRetry(policy, failureCount, toApiError(error).status),
        retryDelay: (attemptIndex) => computeRetryDelay(policy, attemptIndex + 1),
      },
      mutations: { retry: 0 },
    },
  });
}
