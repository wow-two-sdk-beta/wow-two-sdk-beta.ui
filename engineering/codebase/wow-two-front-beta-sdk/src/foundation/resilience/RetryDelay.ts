import { BackoffStrategy } from './BackoffStrategy';
import { JitterStrategy } from './JitterStrategy';
import { DefaultTransientStatuses, type RetryPolicy } from './RetryPolicy';

/** Computes the raw (pre-jitter) backoff delay for an attempt, capped at `maxDelayMs`. */
function backoffDelay(policy: RetryPolicy, attempt: number): number {
  const { backoff, baseDelayMs } = policy;
  const raw =
    backoff === BackoffStrategy.Constant
      ? baseDelayMs
      : backoff === BackoffStrategy.Linear
        ? baseDelayMs * attempt
        : baseDelayMs * 2 ** (attempt - 1);
  return policy.maxDelayMs != null ? Math.min(raw, policy.maxDelayMs) : raw;
}

/** Applies the policy's jitter to a delay; `previousDelayMs` powers decorrelated jitter. */
function applyJitter(policy: RetryPolicy, delay: number, previousDelayMs: number, random: () => number): number {
  switch (policy.jitter ?? JitterStrategy.None) {
    case JitterStrategy.Full:
      return random() * delay;
    case JitterStrategy.Equal:
      return delay / 2 + random() * (delay / 2);
    case JitterStrategy.Decorrelated: {
      const next = policy.baseDelayMs + random() * (previousDelayMs * 3 - policy.baseDelayMs);
      return policy.maxDelayMs != null ? Math.min(next, policy.maxDelayMs) : Math.max(next, policy.baseDelayMs);
    }
    default:
      return delay;
  }
}

/** Computes the delay (ms) to wait before a retry attempt (1-based), per the policy's backoff + jitter — `random` is injectable for deterministic tests. */
export function computeRetryDelay(policy: RetryPolicy, attempt: number, previousDelayMs = 0, random: () => number = Math.random): number {
  const delay = backoffDelay(policy, attempt);
  return Math.round(applyJitter(policy, delay, previousDelayMs || delay, random));
}

/** Decides whether a failed attempt should retry — within `maxRetries` and the status is transient per the policy. */
export function shouldRetry(policy: RetryPolicy, failureCount: number, status: number): boolean {
  const transient = new Set(policy.retryableStatuses ?? DefaultTransientStatuses);
  return failureCount < policy.maxRetries && transient.has(status);
}
