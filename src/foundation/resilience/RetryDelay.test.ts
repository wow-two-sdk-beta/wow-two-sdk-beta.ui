import { describe, it, expect } from 'vitest';

import { BackoffStrategy } from './BackoffStrategy';
import { JitterStrategy } from './JitterStrategy';
import type { RetryPolicy } from './RetryPolicy';
import { computeRetryDelay, shouldRetry } from './RetryDelay';

const policy = (over: Partial<RetryPolicy> = {}): RetryPolicy => ({
  maxRetries: 3,
  backoff: BackoffStrategy.Exponential,
  baseDelayMs: 100,
  ...over,
});

describe('computeRetryDelay — backoff', () => {
  it('constant → fixed', () => {
    const p = policy({ backoff: BackoffStrategy.Constant });
    expect(computeRetryDelay(p, 1)).toBe(100);
    expect(computeRetryDelay(p, 3)).toBe(100);
  });

  it('linear → base × attempt', () => {
    const p = policy({ backoff: BackoffStrategy.Linear });
    expect(computeRetryDelay(p, 1)).toBe(100);
    expect(computeRetryDelay(p, 3)).toBe(300);
  });

  it('exponential → base × 2^(attempt−1)', () => {
    const p = policy({ backoff: BackoffStrategy.Exponential });
    expect(computeRetryDelay(p, 1)).toBe(100);
    expect(computeRetryDelay(p, 2)).toBe(200);
    expect(computeRetryDelay(p, 3)).toBe(400);
  });

  it('caps at maxDelayMs', () => {
    expect(computeRetryDelay(policy({ maxDelayMs: 250 }), 3)).toBe(250);
  });
});

describe('computeRetryDelay — jitter (injected random)', () => {
  it('full → random × delay', () => {
    const p = policy({ backoff: BackoffStrategy.Constant, jitter: JitterStrategy.Full });
    expect(computeRetryDelay(p, 1, 0, () => 0.5)).toBe(50);
    expect(computeRetryDelay(p, 1, 0, () => 0)).toBe(0);
  });

  it('equal → delay/2 + random × delay/2', () => {
    const p = policy({ backoff: BackoffStrategy.Constant, jitter: JitterStrategy.Equal });
    expect(computeRetryDelay(p, 1, 0, () => 0.5)).toBe(75);
  });
});

describe('shouldRetry', () => {
  it('retries a transient status within maxRetries, stops when exhausted', () => {
    const p = policy({ maxRetries: 2 });
    expect(shouldRetry(p, 1, 503)).toBe(true);
    expect(shouldRetry(p, 2, 503)).toBe(false);
  });

  it('does not retry a non-transient status (4xx)', () => {
    expect(shouldRetry(policy(), 1, 404)).toBe(false);
    expect(shouldRetry(policy(), 1, 400)).toBe(false);
  });

  it('honors a custom retryableStatuses', () => {
    const p = policy({ retryableStatuses: [409] });
    expect(shouldRetry(p, 1, 409)).toBe(true);
    expect(shouldRetry(p, 1, 503)).toBe(false);
  });
});
