import { CancelledError, MutationObserver } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';

import { ApiError } from '../foundation/http';
import { BackoffStrategy, JitterStrategy, type RetryPolicy } from '../foundation/resilience';

import { createQueryClient } from './CreateQueryClient';

/** A deterministic fast policy — exponential from 1ms, no jitter, 2 retries over the given statuses. */
function fastPolicy(overrides: Partial<RetryPolicy> = {}): RetryPolicy {
  return {
    maxRetries: 2,
    backoff: BackoffStrategy.Exponential,
    baseDelayMs: 1,
    jitter: JitterStrategy.None,
    retryableStatuses: [0, 503],
    ...overrides,
  };
}

/** Builds an AbortError the way a fetch rejection delivers one — named, not wrapped. */
function abortError(): Error {
  return Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' });
}

describe('createQueryClient', () => {
  it('applies the house defaults — 30s stale, 5m gc, no focus-refetch, mutations never retry', () => {
    const client = createQueryClient();
    const { queries, mutations } = client.getDefaultOptions();

    expect(queries?.staleTime).toBe(30_000);
    expect(queries?.gcTime).toBe(5 * 60_000);
    expect(queries?.refetchOnWindowFocus).toBe(false);
    expect(mutations?.retry).toBe(0);
  });

  it('retries a transient status per the policy, then resolves', async () => {
    const client = createQueryClient({ retry: fastPolicy() });
    let calls = 0;
    const queryFn = vi.fn(() => {
      calls += 1;
      return calls < 3 ? Promise.reject(new ApiError(503, null, 'down')) : Promise.resolve('up');
    });

    await expect(client.fetchQuery({ queryKey: ['retry', 'transient'], queryFn })).resolves.toBe('up');
    expect(queryFn).toHaveBeenCalledTimes(3); // 1 initial + maxRetries 2
  });

  it('stops after maxRetries when the failure persists', async () => {
    const client = createQueryClient({ retry: fastPolicy({ maxRetries: 1 }) });
    const queryFn = vi.fn(() => Promise.reject(new ApiError(503, null, 'down')));

    await expect(client.fetchQuery({ queryKey: ['retry', 'exhausted'], queryFn })).rejects.toBeInstanceOf(ApiError);
    expect(queryFn).toHaveBeenCalledTimes(2); // 1 initial + maxRetries 1
  });

  it('does not retry a status outside the policy transient set', async () => {
    const client = createQueryClient({ retry: fastPolicy() });
    const queryFn = vi.fn(() => Promise.reject(new ApiError(404, null, 'missing')));

    await expect(client.fetchQuery({ queryKey: ['retry', 'nontransient'], queryFn })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('retries a non-ApiError rejection as status 0 (network / unknown)', async () => {
    const client = createQueryClient({ retry: fastPolicy({ maxRetries: 1 }) });
    const queryFn = vi.fn(() => Promise.reject(new Error('socket hangup')));

    await expect(client.fetchQuery({ queryKey: ['retry', 'wrapped'], queryFn })).rejects.toBeInstanceOf(Error);
    expect(queryFn).toHaveBeenCalledTimes(2); // status 0 is in the transient set
  });

  it('never retries an AbortError — a cancellation is intent, not a transient failure', async () => {
    const client = createQueryClient({ retry: fastPolicy() });
    const queryFn = vi.fn(() => Promise.reject(abortError()));

    await expect(client.fetchQuery({ queryKey: ['retry', 'abort'], queryFn })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('wires retryDelay to the policy backoff (1-based attempt over the 0-based index)', () => {
    const client = createQueryClient({ retry: fastPolicy({ baseDelayMs: 100 }) });
    const retryDelay = client.getDefaultOptions().queries?.retryDelay;
    if (typeof retryDelay !== 'function') throw new Error('expected a retryDelay function');

    const err = new Error('x');
    expect(retryDelay(0, err)).toBe(100); // attempt 1 → base
    expect(retryDelay(1, err)).toBe(200); // attempt 2 → base * 2
    expect(retryDelay(2, err)).toBe(400); // attempt 3 → base * 4
  });

  it('onError receives the coerced ApiError once per query failure (after retries exhaust)', async () => {
    const onError = vi.fn();
    const client = createQueryClient({ onError, retry: fastPolicy({ maxRetries: 1 }) });
    const queryFn = vi.fn(() => Promise.reject(new Error('boom')));

    await expect(client.fetchQuery({ queryKey: ['onerror', 'query'], queryFn })).rejects.toBeInstanceOf(Error);

    expect(onError).toHaveBeenCalledTimes(1); // once per settled failure, not per attempt
    const received: unknown = onError.mock.calls[0]?.[0];
    expect(received).toBeInstanceOf(ApiError);
    expect((received as ApiError).status).toBe(0);
    expect((received as ApiError).message).toBe('boom');
  });

  it('onError fires for mutation failures too, coerced the same way', async () => {
    const onError = vi.fn();
    const client = createQueryClient({ onError });
    const mutation = new MutationObserver(client, {
      mutationFn: () => Promise.reject(new ApiError(422, null, 'invalid')),
    });

    await expect(mutation.mutate(undefined)).rejects.toBeInstanceOf(ApiError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0]?.[0] as ApiError).status).toBe(422);
  });

  it('meta.suppressGlobalError keeps a query failure out of the global onError; unsuppressed still fires with its meta', async () => {
    const onError = vi.fn();
    const client = createQueryClient({ onError, retry: fastPolicy() });

    await expect(
      client.fetchQuery({
        queryKey: ['onerror', 'suppressed'],
        queryFn: () => Promise.reject(new ApiError(500, null, 'silent')),
        meta: { suppressGlobalError: true },
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(onError).not.toHaveBeenCalled();

    await expect(
      client.fetchQuery({
        queryKey: ['onerror', 'loud'],
        queryFn: () => Promise.reject(new ApiError(500, null, 'loud')),
        meta: { note: 'kept' },
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0]?.[0] as ApiError).message).toBe('loud');
    expect(onError.mock.calls[0]?.[1]).toEqual({ meta: { note: 'kept' } }); // context carries the call's meta
  });

  it('meta.suppressGlobalError applies to mutation failures too', async () => {
    const onError = vi.fn();
    const client = createQueryClient({ onError });
    const mutation = new MutationObserver(client, {
      mutationFn: () => Promise.reject(new ApiError(422, null, 'invalid')),
      meta: { suppressGlobalError: true },
    });

    await expect(mutation.mutate(undefined)).rejects.toBeInstanceOf(ApiError);
    expect(onError).not.toHaveBeenCalled();
  });

  it('onError skips cancellations — AbortError and RQ CancelledError never toast', async () => {
    const onError = vi.fn();
    const client = createQueryClient({ onError, retry: fastPolicy() });

    await expect(
      client.fetchQuery({ queryKey: ['onerror', 'abort'], queryFn: () => Promise.reject(abortError()) }),
    ).rejects.toMatchObject({ name: 'AbortError' });

    const mutation = new MutationObserver(client, {
      mutationFn: () => Promise.reject(new CancelledError()),
    });
    await expect(mutation.mutate(undefined)).rejects.toBeInstanceOf(CancelledError);

    expect(onError).not.toHaveBeenCalled();
  });
});
