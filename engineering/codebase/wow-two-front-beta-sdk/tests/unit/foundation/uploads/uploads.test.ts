import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BackoffStrategy,
  JitterStrategy,
  computeRetryDelay,
  shouldRetry,
  type RetryPolicy,
} from '@src/foundation/resilience';
import {
  DefaultUploadConcurrency,
  UploadHttpError,
  UploadRejectionReason,
  UploadStatus,
  createUploadQueue,
  isUploadActive,
  isUploadTerminal,
  readUploadErrorStatus,
  type UploadTransport,
  type UploadTransportContext,
} from '@src/foundation/uploads';

// Node project — the queue is pure scheduling (no DOM, no React); the hook lives in `useUploadQueue.browser.test.ts`
// and the xhr transport in `xhrUploadTransport.test.ts`.
//
// Everything is driven through a MANUAL transport: `upload()` parks a deferred and hands the test its `resolve` /
// `reject` / `onProgress` handles, so each scheduling decision is observed at a point the test chose rather than
// raced against. The same fake records concurrent entries into `maxInFlight`, which is what makes the
// concurrency-cap assertion real rather than incidental.
//
// Cancellation and retry are both asynchronous by construction (abort unwinds through the transport; a retry
// waits out a backoff), so tests `flush()` microtasks or advance fake timers instead of asserting synchronously.

/** One parked transport call plus the handles to settle it. */
interface PendingUpload {
  readonly file: File;
  readonly signal: AbortSignal;
  readonly resolve: (value: string) => void;
  readonly reject: (error: unknown) => void;
  readonly progress: UploadTransportContext['onProgress'];
}

/** A transport whose every call parks until the test settles it, tracking peak concurrent entries. */
function createManualTransport(): {
  transport: UploadTransport<string>;
  calls: PendingUpload[];
  maxInFlight: () => number;
} {
  const calls: PendingUpload[] = [];
  let inFlight = 0;
  let maxInFlight = 0;

  const transport: UploadTransport<string> = {
    upload(file, { signal, onProgress }) {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      return new Promise<string>((resolve, reject) => {
        calls.push({
          file,
          signal,
          progress: onProgress,
          resolve: (value) => {
            inFlight -= 1;
            resolve(value);
          },
          reject: (error) => {
            inFlight -= 1;
            reject(error);
          },
        });
      });
    },
  };

  return { transport, calls, maxInFlight: () => maxInFlight };
}

/** Builds a `File` of exactly `size` zero bytes. */
function makeFile(name: string, size = 100, type = 'text/plain'): File {
  return new File([new Uint8Array(size)], name, { type });
}

/** Drains the microtask queue — the queue's status transitions hop several `await`s. */
async function flush(turns = 10): Promise<void> {
  for (let index = 0; index < turns; index += 1) await Promise.resolve();
}

/** Deterministic retry policy: constant 1s backoff, no jitter, so a test can assert the exact delay. */
const constantPolicy: RetryPolicy = {
  maxRetries: 2,
  backoff: BackoffStrategy.Constant,
  baseDelayMs: 1_000,
  jitter: JitterStrategy.None,
};

afterEach(() => {
  vi.useRealTimers();
});

describe('createUploadQueue — admission', () => {
  it('returns an id per added file and keeps admission order', () => {
    const { transport } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 1 });

    const ids = queue.add([makeFile('a.txt'), makeFile('b.txt'), makeFile('c.txt')]);

    expect(ids).toHaveLength(3);
    expect(queue.items().map((item) => item.id)).toEqual(ids);
    expect(queue.items().map((item) => item.file.name)).toEqual(['a.txt', 'b.txt', 'c.txt']);
  });

  it('accepts a single file as well as an array, always returning an array', () => {
    const { transport } = createManualTransport();
    const queue = createUploadQueue({ transport });

    const ids = queue.add(makeFile('solo.txt'));

    expect(ids).toHaveLength(1);
    expect(queue.get(ids[0]!)?.file.name).toBe('solo.txt');
  });

  it('starts uploads in queueing order', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 1 });

    queue.add([makeFile('first.txt'), makeFile('second.txt'), makeFile('third.txt')]);
    await flush();
    expect(calls.map((call) => call.file.name)).toEqual(['first.txt']);

    calls[0]!.resolve('ok');
    await flush();
    expect(calls.map((call) => call.file.name)).toEqual(['first.txt', 'second.txt']);

    calls[1]!.resolve('ok');
    await flush();
    expect(calls.map((call) => call.file.name)).toEqual(['first.txt', 'second.txt', 'third.txt']);
  });

  it('defaults concurrency to 3', async () => {
    const { transport, maxInFlight } = createManualTransport();
    const queue = createUploadQueue({ transport });

    queue.add([makeFile('a'), makeFile('b'), makeFile('c'), makeFile('d'), makeFile('e')]);
    await flush();

    expect(DefaultUploadConcurrency).toBe(3);
    expect(maxInFlight()).toBe(3);
  });
});

describe('createUploadQueue — concurrency', () => {
  it('never exceeds the cap and starts the next item as one settles', async () => {
    const { transport, calls, maxInFlight } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 2 });

    queue.add([makeFile('a'), makeFile('b'), makeFile('c'), makeFile('d'), makeFile('e'), makeFile('f')]);
    await flush();

    expect(calls).toHaveLength(2);
    expect(queue.state().counts[UploadStatus.Uploading]).toBe(2);
    expect(queue.state().counts[UploadStatus.Queued]).toBe(4);

    // Settle one at a time; the pool must refill to exactly 2, never 3.
    for (let index = 0; index < 6; index += 1) {
      calls[index]!.resolve('ok');
      await flush();
      expect(maxInFlight()).toBeLessThanOrEqual(2);
    }

    expect(calls).toHaveLength(6);
    expect(maxInFlight()).toBe(2);
    expect(queue.state().counts[UploadStatus.Succeeded]).toBe(6);
    expect(queue.state().isUploading).toBe(false);
  });

  it('clamps a concurrency below 1 up to 1', async () => {
    const { transport, maxInFlight } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 0 });

    queue.add([makeFile('a'), makeFile('b')]);
    await flush();

    expect(maxInFlight()).toBe(1);
  });
});

describe('createUploadQueue — progress', () => {
  it('tracks per-item progress and aggregates it across the queue', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 2 });

    const [first, second] = queue.add([makeFile('a', 100), makeFile('b', 100)]);
    await flush();

    calls[0]!.progress(50);
    calls[1]!.progress(25);

    expect(queue.get(first!)?.progress).toBe(0.5);
    expect(queue.get(first!)?.bytesUploaded).toBe(50);
    expect(queue.get(second!)?.progress).toBe(0.25);

    const state = queue.state();
    expect(state.bytesUploaded).toBe(75);
    expect(state.totalBytes).toBe(200);
    expect(state.progress).toBe(0.375);
  });

  it('normalizes on the ratio the transport reports, so multipart overhead cannot overshoot the file size', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport });

    const [id] = queue.add(makeFile('a', 100));
    await flush();

    // A multipart body is larger than the file: half of 120 sent = half of the file's 100 bytes.
    calls[0]!.progress(60, 120);

    expect(queue.get(id!)?.progress).toBe(0.5);
    expect(queue.get(id!)?.bytesUploaded).toBe(50);
  });

  it('completes progress to 1 on success', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport });

    const [id] = queue.add(makeFile('a', 100));
    await flush();
    calls[0]!.progress(10);
    calls[0]!.resolve('done');
    await flush();

    const item = queue.get(id!);
    expect(item?.status).toBe(UploadStatus.Succeeded);
    expect(item?.progress).toBe(1);
    expect(item?.bytesUploaded).toBe(100);
    expect(item?.result).toBe('done');
    expect(queue.state().progress).toBe(1);
  });

  it('excludes a cancelled item from the aggregate so progress can still reach 1', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 2 });

    const [keep, drop] = queue.add([makeFile('a', 100), makeFile('b', 100)]);
    await flush();

    queue.cancel(drop!);
    calls[1]!.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    calls[0]!.resolve('ok');
    await flush();

    expect(queue.get(drop!)?.status).toBe(UploadStatus.Cancelled);
    expect(queue.get(keep!)?.status).toBe(UploadStatus.Succeeded);
    expect(queue.state().totalBytes).toBe(100);
    expect(queue.state().progress).toBe(1);
  });
});

describe('createUploadQueue — retry', () => {
  it('retries a failed attempt on the policy delay and counts attempts', async () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, retry: { ...constantPolicy, onRetry } });

    const [id] = queue.add(makeFile('a'));
    await flush();
    expect(queue.get(id!)?.attempt).toBe(1);

    // The policy itself says this failure is retryable — the queue must not decide independently.
    expect(shouldRetry(constantPolicy, 0, 0)).toBe(true);
    calls[0]!.reject(new Error('network down'));
    await flush();

    // Still uploading: the item holds its slot through the backoff wait, and has not been re-sent yet.
    expect(queue.get(id!)?.status).toBe(UploadStatus.Uploading);
    expect(calls).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(computeRetryDelay(constantPolicy, 1));
    expect(calls).toHaveLength(2);
    expect(queue.get(id!)?.attempt).toBe(2);
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ attempt: 1, status: 0, delayMs: 1_000 }));

    calls[1]!.reject(new Error('still down'));
    await vi.advanceTimersByTimeAsync(computeRetryDelay(constantPolicy, 2));
    expect(calls).toHaveLength(3);
    expect(queue.get(id!)?.attempt).toBe(3);

    // maxRetries = 2, so the third failure is terminal — matching the policy, not a local counter.
    expect(shouldRetry(constantPolicy, 2, 0)).toBe(false);
    calls[2]!.reject(new Error('gave up'));
    await flush();

    expect(queue.get(id!)?.status).toBe(UploadStatus.Failed);
    expect(queue.get(id!)?.attempt).toBe(3);
    expect(queue.get(id!)?.error?.message).toBe('gave up');
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('uses the policy backoff curve for each delay', async () => {
    vi.useFakeTimers();
    const exponential: RetryPolicy = {
      maxRetries: 2,
      backoff: BackoffStrategy.Exponential,
      baseDelayMs: 100,
      jitter: JitterStrategy.None,
    };
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, retry: exponential });

    queue.add(makeFile('a'));
    await flush();
    calls[0]!.reject(new Error('boom'));
    await flush();

    // First retry waits base × 2^0 = 100ms — one tick short must NOT have re-sent.
    await vi.advanceTimersByTimeAsync(computeRetryDelay(exponential, 1) - 1);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2);

    calls[1]!.reject(new Error('boom'));
    await flush();

    // Second retry waits base × 2^1 = 200ms.
    expect(computeRetryDelay(exponential, 2)).toBe(200);
    await vi.advanceTimersByTimeAsync(computeRetryDelay(exponential, 2) - 1);
    expect(calls).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(3);
  });

  it('does not retry a non-transient status', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, retry: constantPolicy });

    const [id] = queue.add(makeFile('a'));
    await flush();

    expect(shouldRetry(constantPolicy, 0, 413)).toBe(false);
    calls[0]!.reject(new UploadHttpError(413, 'too large'));
    await flush();

    expect(queue.get(id!)?.status).toBe(UploadStatus.Failed);
    expect(queue.get(id!)?.attempt).toBe(1);
    expect(calls).toHaveLength(1);
  });

  it('fails on the first error when retry is disabled', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, retry: false });

    const [id] = queue.add(makeFile('a'));
    await flush();
    calls[0]!.reject(new Error('nope'));
    await flush();

    expect(queue.get(id!)?.status).toBe(UploadStatus.Failed);
    expect(calls).toHaveLength(1);
  });

  it('frees the slot for the next item once an item exhausts its retries', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 1, retry: false });

    queue.add([makeFile('a'), makeFile('b')]);
    await flush();
    calls[0]!.reject(new Error('nope'));
    await flush();

    expect(calls).toHaveLength(2);
    expect(calls[1]!.file.name).toBe('b');
  });
});

describe('createUploadQueue — cancellation', () => {
  it('does not retry a cancelled upload', async () => {
    vi.useFakeTimers();
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, retry: constantPolicy });

    const [id] = queue.add(makeFile('a'));
    await flush();

    queue.cancel(id!);
    expect(calls[0]!.signal.aborted).toBe(true);

    // The transport unwinds with the abort the queue asked for — a retryable-looking failure that must NOT retry.
    calls[0]!.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    await flush();

    expect(queue.get(id!)?.status).toBe(UploadStatus.Cancelled);
    expect(queue.get(id!)?.attempt).toBe(1);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toHaveLength(1);
  });

  it('cancels a queued item without ever calling the transport', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 1 });

    const [running, waiting] = queue.add([makeFile('a'), makeFile('b')]);
    await flush();

    expect(queue.cancel(waiting!)).toBe(true);
    expect(queue.get(waiting!)?.status).toBe(UploadStatus.Cancelled);

    calls[0]!.resolve('ok');
    await flush();

    expect(queue.get(running!)?.status).toBe(UploadStatus.Succeeded);
    expect(calls).toHaveLength(1);
  });

  it('cancels everything still in play with cancelAll', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 2 });

    const ids = queue.add([makeFile('a'), makeFile('b'), makeFile('c')]);
    await flush();
    calls[0]!.resolve('ok');
    await flush();

    queue.cancelAll();
    for (const call of calls) {
      if (!call.signal.aborted) continue;
      call.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    }
    await flush();

    const statuses = ids.map((id) => queue.get(id)?.status);
    expect(statuses.filter((status) => status === UploadStatus.Cancelled)).toHaveLength(2);
    expect(statuses.filter((status) => status === UploadStatus.Succeeded)).toHaveLength(1);
    expect(queue.state().isUploading).toBe(false);
  });

  it('reports false when there is nothing to cancel', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport });

    const [id] = queue.add(makeFile('a'));
    await flush();
    calls[0]!.resolve('ok');
    await flush();

    expect(queue.cancel(id!)).toBe(false);
    expect(queue.cancel('missing')).toBe(false);
  });

  it('lands on cancelled even when the transport ignores its signal and resolves', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport });

    const [id] = queue.add(makeFile('a'));
    await flush();

    queue.cancel(id!);
    calls[0]!.resolve('ignored the abort');
    await flush();

    expect(queue.get(id!)?.status).toBe(UploadStatus.Cancelled);
    expect(queue.get(id!)?.result).toBeUndefined();
  });
});

describe('createUploadQueue — retry(id), remove, clear', () => {
  it('re-runs a failed item and continues its attempt count', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, retry: false });

    const [id] = queue.add(makeFile('a'));
    await flush();
    calls[0]!.reject(new Error('nope'));
    await flush();
    expect(queue.get(id!)?.status).toBe(UploadStatus.Failed);
    expect(queue.get(id!)?.attempt).toBe(1);

    expect(queue.retry(id!)).toBe(true);
    await flush();

    expect(calls).toHaveLength(2);
    expect(queue.get(id!)?.status).toBe(UploadStatus.Uploading);
    expect(queue.get(id!)?.attempt).toBe(2);
    expect(queue.get(id!)?.error).toBeUndefined();

    calls[1]!.resolve('ok second time');
    await flush();
    expect(queue.get(id!)?.status).toBe(UploadStatus.Succeeded);
    expect(queue.get(id!)?.result).toBe('ok second time');
  });

  it('refuses to retry an item that was rejected up front, or one that is not failed', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, maxSize: 10 });

    const [rejected] = queue.add(makeFile('big.txt', 5_000));
    const [running] = queue.add(makeFile('ok.txt', 5));
    await flush();

    expect(queue.retry(rejected!)).toBe(false);
    expect(queue.retry(running!)).toBe(false);
    expect(queue.retry('missing')).toBe(false);

    calls[0]!.resolve('ok');
    await flush();
    expect(queue.retry(running!)).toBe(false);
  });

  it('removes an item, aborting it when in flight', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 1 });

    const [first, second] = queue.add([makeFile('a'), makeFile('b')]);
    await flush();

    expect(queue.remove(first!)).toBe(true);
    expect(calls[0]!.signal.aborted).toBe(true);
    expect(queue.get(first!)).toBeUndefined();
    expect(queue.items()).toHaveLength(1);
    expect(queue.remove('missing')).toBe(false);

    // The freed slot admits the next item; the orphaned attempt's late rejection must not resurrect a row.
    await flush();
    calls[0]!.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    await flush();

    expect(queue.items()).toHaveLength(1);
    expect(queue.get(second!)?.status).toBe(UploadStatus.Uploading);
  });

  it('clears every item and cancels what is in flight', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 2 });

    queue.add([makeFile('a'), makeFile('b'), makeFile('c')]);
    await flush();

    queue.clear();

    expect(calls[0]!.signal.aborted).toBe(true);
    expect(calls[1]!.signal.aborted).toBe(true);
    expect(queue.items()).toHaveLength(0);
    expect(queue.state().total).toBe(0);

    // Late settlements from the orphaned attempts are dropped, not re-added.
    calls[0]!.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    calls[1]!.resolve('too late');
    await flush();
    expect(queue.items()).toHaveLength(0);
  });
});

describe('createUploadQueue — validation', () => {
  it('rejects a file that fails the accept list, without queueing it', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, accept: 'image/*' });

    const [id] = queue.add(makeFile('notes.txt', 10, 'text/plain'));
    await flush();

    const item = queue.get(id!);
    expect(item?.status).toBe(UploadStatus.Failed);
    expect(item?.rejection).toBe(UploadRejectionReason.Type);
    expect(item?.error?.message).toContain('notes.txt');
    expect(item?.error?.message).toContain('image/*');
    expect(item?.attempt).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it('admits a file that matches the accept list', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, accept: 'image/*,.pdf' });

    queue.add([makeFile('photo.png', 10, 'image/png'), makeFile('doc.pdf', 10, '')]);
    await flush();

    expect(calls.map((call) => call.file.name)).toEqual(['photo.png', 'doc.pdf']);
  });

  it('rejects an oversized file with a human-readable limit', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, maxSize: 1_000 });

    const [id] = queue.add(makeFile('big.bin', 2_048, 'application/octet-stream'));
    await flush();

    const item = queue.get(id!);
    expect(item?.status).toBe(UploadStatus.Failed);
    expect(item?.rejection).toBe(UploadRejectionReason.Size);
    expect(item?.error?.message).toMatch(/2(\.0)?\s?kB/i);
    expect(calls).toHaveLength(0);
  });

  it('keeps the queue running when one file of a batch is invalid', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, accept: 'image/*' });

    const ids = queue.add([makeFile('a.png', 10, 'image/png'), makeFile('b.txt', 10, 'text/plain')]);
    await flush();

    expect(calls).toHaveLength(1);
    expect(queue.get(ids[0]!)?.status).toBe(UploadStatus.Uploading);
    expect(queue.get(ids[1]!)?.rejection).toBe(UploadRejectionReason.Type);
    expect(queue.state().counts[UploadStatus.Failed]).toBe(1);
  });
});

describe('createUploadQueue — subscription', () => {
  it('notifies on admission, progress, and settlement, and stops after unsubscribe', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport });
    const listener = vi.fn();

    const unsubscribe = queue.subscribe(listener);

    // Two synchronous changes: the admission itself, then the item's `queued` → `uploading` transition as the
    // pool picks it up. Both are real state changes; neither is collapsed into the other.
    queue.add(makeFile('a', 100));
    expect(listener).toHaveBeenCalledTimes(2);

    await flush();
    const afterStart = listener.mock.calls.length;

    calls[0]!.progress(50);
    expect(listener.mock.calls.length).toBeGreaterThan(afterStart);

    const beforeSettle = listener.mock.calls.length;
    calls[0]!.resolve('ok');
    await flush();
    expect(listener.mock.calls.length).toBeGreaterThan(beforeSettle);

    unsubscribe();
    const afterUnsubscribe = listener.mock.calls.length;
    queue.add(makeFile('b'));
    expect(listener).toHaveBeenCalledTimes(afterUnsubscribe);
  });

  it('notifies once for a whole batch, not once per file', () => {
    const { transport } = createManualTransport();
    const queue = createUploadQueue({ transport, concurrency: 1 });
    const listener = vi.fn();
    queue.subscribe(listener);

    const before = queue.version();
    queue.add([makeFile('a'), makeFile('b'), makeFile('c')]);

    // 1 admission + 1 start (concurrency 1). Per-file admission would be 4 — that is what this pins down.
    expect(listener).toHaveBeenCalledTimes(2);
    expect(queue.version()).toBe(before + 2);
  });

  it('skips a no-op progress report so listeners are not woken for nothing', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport });

    queue.add(makeFile('a', 100));
    await flush();
    calls[0]!.progress(50);

    const version = queue.version();
    calls[0]!.progress(50);
    expect(queue.version()).toBe(version);
  });
});

describe('createUploadQueue — failure containment', () => {
  it('never throws at the caller when the transport throws synchronously', async () => {
    const exploding: UploadTransport<string> = {
      upload() {
        throw new UploadHttpError(400, 'bad request');
      },
    };
    const queue = createUploadQueue({ transport: exploding, concurrency: 2, retry: false });

    const ids = queue.add([makeFile('a'), makeFile('b')]);
    await flush();

    for (const id of ids) {
      expect(queue.get(id)?.status).toBe(UploadStatus.Failed);
      expect(queue.get(id)?.error?.message).toBe('bad request');
    }
  });

  it('normalizes a non-Error rejection into an Error', async () => {
    const { transport, calls } = createManualTransport();
    const queue = createUploadQueue({ transport, retry: false });

    const [id] = queue.add(makeFile('a'));
    await flush();
    calls[0]!.reject('just a string');
    await flush();

    expect(queue.get(id!)?.error).toBeInstanceOf(Error);
    expect(queue.get(id!)?.error?.message).toContain('just a string');
  });
});

describe('uploads — helpers', () => {
  it('reads a status off any error shape, defaulting to the transient 0', () => {
    expect(readUploadErrorStatus(new UploadHttpError(503))).toBe(503);
    expect(readUploadErrorStatus(Object.assign(new Error('api'), { status: 429 }))).toBe(429);
    expect(readUploadErrorStatus(new Error('plain'))).toBe(0);
    expect(readUploadErrorStatus(undefined)).toBe(0);
    expect(readUploadErrorStatus({ status: 'nope' })).toBe(0);
  });

  it('classifies terminal and active statuses', () => {
    expect(isUploadTerminal(UploadStatus.Succeeded)).toBe(true);
    expect(isUploadTerminal(UploadStatus.Failed)).toBe(true);
    expect(isUploadTerminal(UploadStatus.Cancelled)).toBe(true);
    expect(isUploadTerminal(UploadStatus.Queued)).toBe(false);
    expect(isUploadTerminal(UploadStatus.Uploading)).toBe(false);
    expect(isUploadActive(UploadStatus.Uploading)).toBe(true);
    expect(isUploadActive(UploadStatus.Queued)).toBe(false);
  });
});
