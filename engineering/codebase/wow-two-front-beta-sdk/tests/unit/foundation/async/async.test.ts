// Unit coverage for `foundation/async`. Node project — every helper here is DOM-free by design, so the
// only environment dependency is `AbortController`, which node provides natively.
//
// Fake timers throughout: the timing helpers are the point of the slice, and asserting real elapsed time
// would make the suite both slow and flaky. `advanceTimersByTimeAsync` (not the sync variant) is used
// wherever a promise must settle, since it flushes the microtask queue between timer ticks — the sync
// version fires the callback but never lets the `await` chain behind it resume.
//
// The leak assertions are the reason several tests look redundant: `vi.getTimerCount()` after BOTH settle
// paths is what proves `withTimeout` cannot pin an event loop, and the `removeEventListener` spy is what
// proves a long-lived signal does not accumulate a listener per call. Those are the two failure modes that
// never show up in a results-only test.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { isAbortError, isTimeoutError } from '@src/foundation/errors';
import { BackoffStrategy } from '@src/foundation/resilience/BackoffStrategy';
import { JitterStrategy } from '@src/foundation/resilience/JitterStrategy';
import { computeRetryDelay } from '@src/foundation/resilience/RetryDelay';
import type { RetryPolicy } from '@src/foundation/resilience/RetryPolicy';
import {
  AbortError,
  TimeoutError,
  abortable,
  allSettledValues,
  debounceAsync,
  deferred,
  mapLimit,
  pLimit,
  retryAsync,
  sequential,
  throttleAsync,
  withAbort,
  withTimeout,
} from '@src/foundation/async';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** A promise that never settles — the subject for every deadline / cancellation test. */
function never<T>(): Promise<T> {
  return new Promise<T>(() => {
    // Intentionally never settled.
  });
}

/** Captures a rejection without `expect(...).rejects`, so the caught value can be inspected by recognizer. */
async function rejectionOf(promise: PromiseLike<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject, but it resolved.');
}

describe('deferred', () => {
  it('resolves from outside the executor', async () => {
    const controlled = deferred<string>();
    controlled.resolve('value');
    await expect(controlled.promise).resolves.toBe('value');
  });

  it('rejects from outside the executor', async () => {
    const controlled = deferred<string>();
    controlled.reject(new Error('boom'));
    await expect(controlled.promise).rejects.toThrow('boom');
  });

  it('ignores a second settle, per promise semantics', async () => {
    const controlled = deferred<string>();
    controlled.resolve('first');
    controlled.resolve('second');
    controlled.reject(new Error('too late'));
    await expect(controlled.promise).resolves.toBe('first');
  });
});

describe('withTimeout', () => {
  it('resolves when the work finishes inside the budget', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1_000)).resolves.toBe('ok');
  });

  it('clears its timer on the resolve path', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1_000)).resolves.toBe('ok');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('passes a rejection through and clears its timer', async () => {
    await expect(withTimeout(Promise.reject(new Error('inner')), 1_000)).rejects.toThrow('inner');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects with a TimeoutError once the deadline passes', async () => {
    const guarded = withTimeout(never<string>(), 1_000);
    const assertion = expect(guarded).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(1_000);
    await assertion;
  });

  it('clears its timer on the timeout path', async () => {
    const guarded = withTimeout(never<string>(), 1_000);
    const assertion = expect(guarded).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(1_000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('throws an error that `isTimeoutError` recognizes', async () => {
    const guarded = withTimeout(never<string>(), 50);
    const captured = rejectionOf(guarded);
    await vi.advanceTimersByTimeAsync(50);

    const caught = await captured;
    expect(isTimeoutError(caught)).toBe(true);
    expect(isAbortError(caught)).toBe(false);
  });

  it('fires `onTimeout` so the caller can abort the underlying work', async () => {
    const onTimeout = vi.fn();
    const guarded = withTimeout(never<string>(), 100, { onTimeout });
    const assertion = expect(guarded).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('does not let a throwing `onTimeout` mask the TimeoutError', async () => {
    const guarded = withTimeout(never<string>(), 100, {
      onTimeout: () => {
        throw new Error('cleanup exploded');
      },
    });
    const captured = rejectionOf(guarded);
    await vi.advanceTimersByTimeAsync(100);
    expect(isTimeoutError(await captured)).toBe(true);
  });

  it('does not fire `onTimeout` when the work wins the race', async () => {
    const onTimeout = vi.fn();
    await expect(withTimeout(Promise.resolve('ok'), 1_000, { onTimeout })).resolves.toBe('ok');
    await vi.advanceTimersByTimeAsync(5_000);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('applies no deadline for a non-positive duration', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 0)).resolves.toBe('ok');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects immediately for an already-aborted signal, arming no timer', async () => {
    const controller = new AbortController();
    controller.abort();

    const caught = await rejectionOf(withTimeout(never<string>(), 1_000, { signal: controller.signal }));
    expect(isAbortError(caught)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects with an AbortError and clears its timer when the signal fires mid-flight', async () => {
    const controller = new AbortController();
    const captured = rejectionOf(withTimeout(never<string>(), 1_000, { signal: controller.signal }));
    expect(vi.getTimerCount()).toBe(1);

    controller.abort();
    expect(isAbortError(await captured)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('abortable', () => {
  it('passes a value through when the signal never fires', async () => {
    const controller = new AbortController();
    await expect(abortable(Promise.resolve('ok'), controller.signal)).resolves.toBe('ok');
  });

  it('honours an already-aborted signal without attaching a listener', async () => {
    const controller = new AbortController();
    controller.abort();
    const add = vi.spyOn(controller.signal, 'addEventListener');

    expect(isAbortError(await rejectionOf(abortable(never<string>(), controller.signal)))).toBe(true);
    expect(add).not.toHaveBeenCalled();
  });

  it('rejects when the signal fires mid-flight', async () => {
    const controller = new AbortController();
    const captured = rejectionOf(abortable(never<string>(), controller.signal));
    controller.abort();
    expect(isAbortError(await captured)).toBe(true);
  });

  it('removes its abort listener once the work settles', async () => {
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, 'removeEventListener');

    await expect(abortable(Promise.resolve('ok'), controller.signal)).resolves.toBe('ok');
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('removes its abort listener when the work rejects', async () => {
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, 'removeEventListener');

    await expect(abortable(Promise.reject(new Error('inner')), controller.signal)).rejects.toThrow('inner');
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('preserves the abort reason as `cause`', async () => {
    const controller = new AbortController();
    const reason = new Error('user navigated away');
    const captured = rejectionOf(abortable(never<string>(), controller.signal));

    controller.abort(reason);
    const caught = await captured;
    expect(caught).toBeInstanceOf(AbortError);
    expect((caught as AbortError).cause).toBe(reason);
  });

  it('is a pass-through when no signal is supplied', async () => {
    await expect(abortable(Promise.resolve('ok'))).resolves.toBe('ok');
  });
});

describe('withAbort', () => {
  it('never invokes `fn` for an already-aborted signal', async () => {
    const controller = new AbortController();
    controller.abort();
    const fn = vi.fn(() => Promise.resolve('never runs'));

    expect(isAbortError(await rejectionOf(withAbort(controller.signal, fn)))).toBe(true);
    expect(fn).not.toHaveBeenCalled();
  });

  it('hands the signal to `fn` so it can cancel the real work', async () => {
    const controller = new AbortController();
    const fn = vi.fn((signal: AbortSignal) => Promise.resolve(signal.aborted));

    await expect(withAbort(controller.signal, fn)).resolves.toBe(false);
    expect(fn).toHaveBeenCalledWith(controller.signal);
  });

  it('rejects when the signal fires mid-flight', async () => {
    const controller = new AbortController();
    const captured = rejectionOf(withAbort(controller.signal, () => never<string>()));

    controller.abort();
    expect(isAbortError(await captured)).toBe(true);
  });

  it('removes its abort listener on settle', async () => {
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, 'removeEventListener');

    await expect(withAbort(controller.signal, () => Promise.resolve('ok'))).resolves.toBe('ok');
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('surfaces a synchronous throw from `fn` as a rejection', async () => {
    const controller = new AbortController();
    await expect(
      withAbort(controller.signal, () => {
        throw new Error('sync boom');
      }),
    ).rejects.toThrow('sync boom');
  });
});

describe('pLimit', () => {
  it('never exceeds the configured concurrency', async () => {
    const limiter = pLimit(2);
    const gates = Array.from({ length: 6 }, () => deferred<void>());

    let live = 0;
    let maxLive = 0;
    const runs = gates.map((gate) =>
      limiter.run(async () => {
        live += 1;
        maxLive = Math.max(maxLive, live);
        await gate.promise;
        live -= 1;
        return live;
      }),
    );

    // Slots are claimed synchronously, so the cap is observable before anything settles.
    expect(live).toBe(2);
    expect(limiter.activeCount()).toBe(2);
    expect(limiter.pendingCount()).toBe(4);

    gates.forEach((gate) => {
      gate.resolve();
    });
    await Promise.all(runs);

    expect(maxLive).toBe(2);
    expect(limiter.activeCount()).toBe(0);
    expect(limiter.pendingCount()).toBe(0);
  });

  it('starts tasks in submission order', async () => {
    const limiter = pLimit(1);
    const started: string[] = [];

    const runs = ['a', 'b', 'c', 'd'].map((label) =>
      limiter.run(async () => {
        started.push(label);
        await Promise.resolve();
        return label;
      }),
    );

    await Promise.all(runs);
    expect(started).toEqual(['a', 'b', 'c', 'd']);
  });

  it('clamps a concurrency below one', () => {
    expect(pLimit(0).concurrency).toBe(1);
    expect(pLimit(-5).concurrency).toBe(1);
    expect(pLimit(2.7).concurrency).toBe(2);
  });

  it('frees the slot when a task rejects, so the pool keeps draining', async () => {
    const limiter = pLimit(1);
    const failing = limiter.run(() => Promise.reject(new Error('boom')));
    const following = limiter.run(() => Promise.resolve('ran anyway'));

    await expect(failing).rejects.toThrow('boom');
    await expect(following).resolves.toBe('ran anyway');
    expect(limiter.activeCount()).toBe(0);
  });

  it('frees the slot when a task throws synchronously', async () => {
    const limiter = pLimit(1);
    const failing = limiter.run<string>(() => {
      throw new Error('sync boom');
    });
    const following = limiter.run(() => Promise.resolve('ran anyway'));

    await expect(failing).rejects.toThrow('sync boom');
    await expect(following).resolves.toBe('ran anyway');
  });
});

describe('mapLimit', () => {
  it('returns results in input order even when completion order differs', async () => {
    // Lower values take more microtask hops, so item 1 finishes last — completion order is the reverse of input.
    const result = await mapLimit([1, 2, 3, 4, 5], 2, async (value) => {
      for (let hop = 0; hop < 6 - value; hop += 1) await Promise.resolve();
      return value * 10;
    });

    expect(result).toEqual([10, 20, 30, 40, 50]);
  });

  it('passes the index alongside the item', async () => {
    const seen = await mapLimit(['a', 'b', 'c'], 2, (item, index) => `${index}:${item}`);
    expect(seen).toEqual(['0:a', '1:b', '2:c']);
  });

  it('respects the cap across the whole batch', async () => {
    let live = 0;
    let maxLive = 0;

    await mapLimit([1, 2, 3, 4, 5, 6, 7, 8], 3, async (value) => {
      live += 1;
      maxLive = Math.max(maxLive, live);
      await Promise.resolve();
      live -= 1;
      return value;
    });

    expect(maxLive).toBe(3);
  });

  it('rejects on the first failure', async () => {
    await expect(
      mapLimit([1, 2, 3], 2, (value) => (value === 2 ? Promise.reject(new Error('item 2')) : Promise.resolve(value))),
    ).rejects.toThrow('item 2');
  });

  it('still runs the remaining tasks after a failure — `Promise.all` semantics, unlike `sequential`', async () => {
    const seen: number[] = [];
    const run = mapLimit([1, 2, 3, 4], 1, (value) => {
      seen.push(value);
      return value === 2 ? Promise.reject(new Error('item 2')) : Promise.resolve(value);
    });

    await expect(run).rejects.toThrow('item 2');
    // Everything was submitted up front, so the queue drains regardless. Documented, not accidental.
    await vi.advanceTimersByTimeAsync(0);
    expect(seen).toEqual([1, 2, 3, 4]);
  });
});

describe('retryAsync', () => {
  const policy: RetryPolicy = {
    maxRetries: 2,
    backoff: BackoffStrategy.Exponential,
    baseDelayMs: 100,
    jitter: JitterStrategy.None,
  };

  it('returns the first success without waiting', async () => {
    const fn = vi.fn(() => Promise.resolve('ok'));
    await expect(retryAsync(fn, { policy })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('waits exactly `computeRetryDelay` between attempts, then stops at the policy max', async () => {
    const fn = vi.fn(() => Promise.reject(new Error('transient')));
    const attempt = retryAsync(fn, { policy });
    const assertion = expect(attempt).rejects.toThrow('transient');

    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    // One tick short of the computed delay: still waiting.
    await vi.advanceTimersByTimeAsync(computeRetryDelay(policy, 1) - 1);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(computeRetryDelay(policy, 2, computeRetryDelay(policy, 1)));
    expect(fn).toHaveBeenCalledTimes(3);

    await assertion;
    // 1 initial attempt + `maxRetries` — never a fourth.
    expect(fn).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('succeeds on a later attempt and reports the attempt number to `fn`', async () => {
    const attempts: number[] = [];
    const fn = vi.fn((attempt: number) => {
      attempts.push(attempt);
      return attempt < 3 ? Promise.reject(new Error('transient')) : Promise.resolve('recovered');
    });

    const run = retryAsync(fn, { policy });
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(run).resolves.toBe('recovered');
    expect(attempts).toEqual([1, 2, 3]);
  });

  it('reports each retry through the policy hook', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn(() => Promise.reject(new Error('transient')));
    const run = retryAsync(fn, { policy: { ...policy, onRetry } });
    const assertion = expect(run).rejects.toThrow('transient');

    await vi.advanceTimersByTimeAsync(1_000);
    await assertion;

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.objectContaining({ attempt: 1, delayMs: 100, status: 0 }));
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.objectContaining({ attempt: 2, delayMs: 200, status: 0 }));
  });

  it('does not retry an AbortError', async () => {
    const fn = vi.fn(() => Promise.reject(new AbortError()));

    const caught = await rejectionOf(retryAsync(fn, { policy }));
    expect(isAbortError(caught)).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not retry a non-transient status', async () => {
    const fn = vi.fn(() => Promise.reject(Object.assign(new Error('bad request'), { status: 400 })));

    await expect(retryAsync(fn, { policy })).rejects.toThrow('bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a transient status', async () => {
    const fn = vi
      .fn<(attempt: number) => Promise<string>>()
      .mockRejectedValueOnce(Object.assign(new Error('unavailable'), { status: 503 }))
      .mockResolvedValueOnce('ok');

    const run = retryAsync(fn, { policy });
    await vi.advanceTimersByTimeAsync(100);

    await expect(run).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('rejects immediately for an already-aborted signal, never invoking `fn`', async () => {
    const controller = new AbortController();
    controller.abort();
    const fn = vi.fn(() => Promise.resolve('never runs'));

    expect(isAbortError(await rejectionOf(retryAsync(fn, { policy, signal: controller.signal })))).toBe(true);
    expect(fn).not.toHaveBeenCalled();
  });

  it('cuts the backoff wait short when the signal fires', async () => {
    const controller = new AbortController();
    const fn = vi.fn(() => Promise.reject(new Error('transient')));
    const captured = rejectionOf(retryAsync(fn, { policy, signal: controller.signal }));

    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    controller.abort();
    expect(isAbortError(await captured)).toBe(true);
    // Aborted during the backoff, so the second attempt never ran and no timer survived.
    expect(fn).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('normalizes a non-Error throw while preserving a real Error by identity', async () => {
    const thrown = Object.assign(new Error('kept'), { status: 400 });
    expect(await rejectionOf(retryAsync(() => Promise.reject(thrown), { policy }))).toBe(thrown);

    const normalized = await rejectionOf(
      retryAsync(() => Promise.reject('a bare string'), { policy: { ...policy, maxRetries: 0 } }),
    );
    expect(normalized).toBeInstanceOf(Error);
    expect((normalized as Error).message).toBe('a bare string');
  });
});

describe('debounceAsync', () => {
  it('collapses a burst into one invocation with the latest arguments', async () => {
    const fn = vi.fn((value: string) => Promise.resolve(`result:${value}`));
    const debounced = debounceAsync(fn, 100);

    void debounced('a');
    void debounced('b');
    const last = debounced('c');

    await vi.advanceTimersByTimeAsync(100);
    await expect(last).resolves.toBe('result:c');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('resolves EVERY superseded caller with the latest result', async () => {
    const fn = vi.fn((value: string) => Promise.resolve(`result:${value}`));
    const debounced = debounceAsync(fn, 100);

    const first = debounced('a');
    const second = debounced('b');
    const third = debounced('c');

    await vi.advanceTimersByTimeAsync(100);

    // The leak this slice exists to prevent: a naive debounce leaves `first` and `second` pending forever.
    await expect(Promise.all([first, second, third])).resolves.toEqual(['result:c', 'result:c', 'result:c']);
  });

  it('fans a rejection out to every parked caller', async () => {
    const debounced = debounceAsync(() => Promise.reject(new Error('inner')), 100);
    const first = debounced();
    const second = debounced();

    const assertions = Promise.all([
      expect(first).rejects.toThrow('inner'),
      expect(second).rejects.toThrow('inner'),
    ]);
    await vi.advanceTimersByTimeAsync(100);
    await assertions;
  });

  it('restarts the window on each call rather than firing on a schedule', async () => {
    const fn = vi.fn((value: string) => Promise.resolve(value));
    const debounced = debounceAsync(fn, 100);

    void debounced('a');
    await vi.advanceTimersByTimeAsync(80);
    const second = debounced('b');
    await vi.advanceTimersByTimeAsync(80);
    expect(fn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(20);
    await expect(second).resolves.toBe('b');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('treats calls arriving after an invocation as a new window', async () => {
    const fn = vi.fn((value: string) => Promise.resolve(value));
    const debounced = debounceAsync(fn, 100);

    const first = debounced('a');
    await vi.advanceTimersByTimeAsync(100);
    await expect(first).resolves.toBe('a');

    const second = debounced('b');
    await vi.advanceTimersByTimeAsync(100);
    await expect(second).resolves.toBe('b');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('cancel() clears the timer and rejects parked callers with an AbortError', async () => {
    const fn = vi.fn((value: string) => Promise.resolve(value));
    const debounced = debounceAsync(fn, 100);

    const parked = debounced('a');
    const captured = rejectionOf(parked);
    debounced.cancel();

    expect(isAbortError(await captured)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(500);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('throttleAsync', () => {
  it('runs the leading call immediately and suppresses the rest of the window', async () => {
    const fn = vi.fn((value: number) => Promise.resolve(value));
    const throttled = throttleAsync(fn, 100);

    const first = throttled(1);
    const second = throttled(2);
    const third = throttled(3);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
    // Suppressed callers share the leading call's result rather than a "was skipped" sentinel.
    await expect(Promise.all([first, second, third])).resolves.toEqual([1, 1, 1]);

    throttled.cancel();
  });

  it('opens a new window once the interval elapses', async () => {
    const fn = vi.fn((value: number) => Promise.resolve(value));
    const throttled = throttleAsync(fn, 100);

    await expect(throttled(1)).resolves.toBe(1);
    await vi.advanceTimersByTimeAsync(99);
    await expect(throttled(2)).resolves.toBe(1);

    await vi.advanceTimersByTimeAsync(1);
    await expect(throttled(3)).resolves.toBe(3);
    expect(fn).toHaveBeenCalledTimes(2);

    throttled.cancel();
  });

  it('surfaces a synchronous throw as a rejection', async () => {
    const throttled = throttleAsync(() => {
      throw new Error('sync boom');
    }, 100);

    await expect(throttled()).rejects.toThrow('sync boom');
    throttled.cancel();
  });

  it('cancel() closes the window early and clears its timer', async () => {
    const fn = vi.fn((value: number) => Promise.resolve(value));
    const throttled = throttleAsync(fn, 100);

    await expect(throttled(1)).resolves.toBe(1);
    throttled.cancel();
    expect(vi.getTimerCount()).toBe(0);

    await expect(throttled(2)).resolves.toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);

    throttled.cancel();
  });
});

describe('sequential', () => {
  it('runs tasks one at a time, in order', async () => {
    const order: string[] = [];
    let live = 0;
    let maxLive = 0;

    const task = (label: string) => async (): Promise<string> => {
      live += 1;
      maxLive = Math.max(maxLive, live);
      order.push(label);
      await Promise.resolve();
      live -= 1;
      return label;
    };

    await expect(sequential([task('a'), task('b'), task('c')])).resolves.toEqual(['a', 'b', 'c']);
    expect(order).toEqual(['a', 'b', 'c']);
    expect(maxLive).toBe(1);
  });

  it('stops at the first failure', async () => {
    const third = vi.fn(() => Promise.resolve('c'));
    await expect(
      sequential([() => Promise.resolve('a'), () => Promise.reject(new Error('b failed')), third]),
    ).rejects.toThrow('b failed');
    expect(third).not.toHaveBeenCalled();
  });

  it('resolves to an empty array for no tasks', async () => {
    await expect(sequential([])).resolves.toEqual([]);
  });
});

describe('allSettledValues', () => {
  it('keeps fulfilled values in input order and drops rejections', async () => {
    const values = await allSettledValues([
      Promise.resolve('a'),
      Promise.reject(new Error('dropped')),
      Promise.resolve('c'),
    ]);
    expect(values).toEqual(['a', 'c']);
  });

  it('never rejects, even when everything fails', async () => {
    await expect(
      allSettledValues([Promise.reject(new Error('one')), Promise.reject(new Error('two'))]),
    ).resolves.toEqual([]);
  });

  it('resolves to an empty array for no promises', async () => {
    await expect(allSettledValues([])).resolves.toEqual([]);
  });
});
