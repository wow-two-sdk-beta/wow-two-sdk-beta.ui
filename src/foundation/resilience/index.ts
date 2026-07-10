// resilience — foundation seam. Framework-agnostic retry primitives: a `RetryPolicy` (backoff · jitter ·
// retryable statuses) plus the pure `computeRetryDelay` / `shouldRetry` helpers that drive it. No React,
// no RQ — consumed by `@wow-two-beta/ui/query` (`createQueryClient`) and reusable by any retry/backoff caller.
export { BackoffStrategy } from './BackoffStrategy';
export { JitterStrategy } from './JitterStrategy';
export { DefaultTransientStatuses, DefaultRetryPolicy, type RetryPolicy, type RetryContext } from './RetryPolicy';
export { computeRetryDelay, shouldRetry } from './RetryDelay';
