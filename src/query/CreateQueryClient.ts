import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import type { ApiError } from '../foundation/http';

import { computeRetryDelay, DefaultRetryPolicy, shouldRetry, type RetryPolicy } from '../foundation/resilience';

import { toApiError } from './ToApiError';

const StaleTimeMs = 30_000;
const GcTimeMs = 5 * 60_000;

/** Defines options for `createQueryClient`. */
export interface CreateQueryClientOptions {
  /** Emits a coerced `ApiError` whenever any query or mutation fails — wire a toast here. */
  readonly onError?: (error: ApiError) => void;

  /** The retry policy for transient query failures (backoff · jitter · retryable statuses). Default `DefaultRetryPolicy`. Mutations never retry. */
  readonly retry?: RetryPolicy;
}

/** Creates the app `QueryClient` — house defaults (30s stale · 5m gc · no focus-refetch · mutations no-retry) + a configurable `RetryPolicy` + global error coercion to `ApiError`. */
export function createQueryClient(options: CreateQueryClientOptions = {}): QueryClient {
  const handleError = (error: unknown): void => options.onError?.(toApiError(error));
  const policy = options.retry ?? DefaultRetryPolicy;

  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        staleTime: StaleTimeMs,
        gcTime: GcTimeMs,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => shouldRetry(policy, failureCount, toApiError(error).status),
        retryDelay: (attemptIndex) => computeRetryDelay(policy, attemptIndex + 1),
      },
      mutations: { retry: 0 },
    },
  });
}
