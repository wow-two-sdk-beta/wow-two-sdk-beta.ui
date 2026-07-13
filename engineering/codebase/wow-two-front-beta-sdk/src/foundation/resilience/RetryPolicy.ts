import { BackoffStrategy } from './BackoffStrategy';
import { JitterStrategy } from './JitterStrategy';

/** Provides the HTTP statuses treated as transient by default — network (`0`) plus the standard transient set. */
export const DefaultTransientStatuses: readonly number[] = [0, 408, 429, 500, 502, 503, 504];

/** Defines the context passed to a retry's `onRetry` hook. */
export interface RetryContext {
  /** The upcoming attempt number (1-based). */
  readonly attempt: number;

  /** The error that triggered the retry. */
  readonly error: unknown;

  /** The coerced HTTP status (`0` = network / unknown). */
  readonly status: number;

  /** The delay (ms) waited before this attempt. */
  readonly delayMs: number;
}

/** Defines a retry policy — how many times, how the delay backs off, whether to jitter, and which failures are transient. */
export interface RetryPolicy {
  /** The max retry attempts after the first failure. */
  readonly maxRetries: number;

  /** The backoff growth across attempts. */
  readonly backoff: BackoffStrategy;

  /** The base delay (ms) — the first backoff step. */
  readonly baseDelayMs: number;

  /** The delay cap (ms); omit for uncapped. */
  readonly maxDelayMs?: number;

  /** The jitter applied to each computed delay. Default `JitterStrategy.None`. */
  readonly jitter?: JitterStrategy;

  /** The HTTP statuses treated as transient (retryable). Default `DefaultTransientStatuses`. */
  readonly retryableStatuses?: readonly number[];

  /** Fires before each retry — logging / metrics. */
  readonly onRetry?: (context: RetryContext) => void;
}

/** Provides the default retry policy — 2 exponential retries with full jitter (base 1s, cap 30s) over the transient statuses. */
export const DefaultRetryPolicy: RetryPolicy = {
  maxRetries: 2,
  backoff: BackoffStrategy.Exponential,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  jitter: JitterStrategy.Full,
  retryableStatuses: DefaultTransientStatuses,
};
