// Browser project — real chromium, so `Worker` is a real OS thread rather than a stub.
//
// THAT DISTINCTION IS THE POINT OF THIS FILE. Every claim here is a claim about what an actual worker
// does: that replies arrive in COMPLETION order rather than request order, that a transferred
// `ArrayBuffer` is neutered in the sender, that `terminate()` really does stop a thread mid-flight. A mock
// pipe could only ever prove the mock agrees with itself — above all for the out-of-order case, where the
// hand-rolled mock a test author would write is precisely the FIFO pipe that hides the bug.
//
// Workers are built from `Blob` URLs inside the test, so the slice needs no fixture file and no bundler
// entry. The consequence is that a blob worker cannot `import` this package, so the worker halves below
// hand-roll the envelope instead of calling `exposeWorkerApi` — they are deliberately written against the
// wire format, not against our host, which also means the client is tested against an INDEPENDENT
// implementation of the protocol rather than against its own mirror image. `exposeWorkerApi` itself is
// covered in `workers.test.ts` through its structural scope.
//
// The delays used to force out-of-order completion are real `setTimeout`s on the worker thread. They are
// small but not zero, and the ordering assertion is explicit — a test that merely checked both values were
// right would pass just as happily against the broken listener-per-call implementation.

import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createWorkerClient,
  isWorkerSupported,
  runInWorker,
  useWorker,
  WorkerMessageChannel,
  type WorkerClient,
  type WorkerClientOptions,
} from '@src/foundation/workers';

/** Awaits a promise expected to reject and hands back the error, so its members can be asserted directly. */
async function captureRejection(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    return error as Error;
  }
  throw new Error('Expected the promise to reject, but it resolved');
}

/** The RPC contract the fixture worker below implements — shared by the client and the hand-rolled worker. */
interface TestApi {
  /** Adds two numbers immediately. */
  add(a: number, b: number): number;
  /** Echoes `value` after waiting `delayMs` on the worker thread — the lever that forces out-of-order replies. */
  echo(value: string, delayMs: number): string;
  /** Throws on the worker thread. */
  boom(): never;
  /** Never replies at all — the shape a timeout and a termination need. */
  hang(): never;
  /** Reads the length of a buffer that was transferred in. */
  byteLength(buffer: ArrayBuffer): number;
  /** Posts an untagged message on the shared pipe before replying properly. */
  noisy(value: string): string;
}

/**
 * The worker half, written directly against the wire format. `WorkerMessageChannel` is interpolated rather
 * than retyped so the fixture cannot drift from the constant the client actually sends.
 */
const WorkerSource = `
const CHANNEL = ${JSON.stringify(WorkerMessageChannel)};

function reply(id, ok, payload, transfer) {
  const message = ok
    ? { channel: CHANNEL, kind: 'response', id: id, ok: true, result: payload }
    : { channel: CHANNEL, kind: 'response', id: id, ok: false, error: payload };
  self.postMessage(message, transfer || undefined);
}

self.onmessage = function (event) {
  const request = event.data;
  if (!request || request.channel !== CHANNEL || request.kind !== 'request') return;
  const id = request.id;
  const args = request.args;

  switch (request.method) {
    case 'add':
      reply(id, true, args[0] + args[1]);
      return;
    case 'echo':
      setTimeout(function () { reply(id, true, args[0]); }, args[1]);
      return;
    case 'boom':
      reply(id, false, { name: 'RangeError', message: 'worker exploded', stack: 'worker.js:1' });
      return;
    case 'hang':
      return;
    case 'byteLength':
      reply(id, true, args[0].byteLength);
      return;
    case 'noisy':
      self.postMessage({ type: 'some-other-library', payload: 1 });
      self.postMessage('a bare string');
      reply(id, true, args[0]);
      return;
    default:
      reply(id, false, { name: 'Error', message: 'unknown method ' + request.method });
  }
};
`;

const objectUrls: string[] = [];
const workers: Worker[] = [];

/** Builds a live worker from source, tracking the URL and the thread for teardown. */
function createWorker(source: string = WorkerSource): Worker {
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  objectUrls.push(url);
  const worker = new Worker(url);
  workers.push(worker);
  return worker;
}

/** Builds a client over a fresh fixture worker. */
function createTestClient(options?: WorkerClientOptions): WorkerClient<TestApi> {
  return createWorkerClient<TestApi>(createWorker(), options);
}

afterEach(() => {
  cleanup();
  for (const worker of workers.splice(0)) worker.terminate();
  for (const url of objectUrls.splice(0)) URL.revokeObjectURL(url);
});

describe('createWorkerClient', () => {
  it('reports Worker as supported in a real browser', () => {
    expect(isWorkerSupported()).toBe(true);
  });

  it('round-trips a call', async () => {
    const client = createTestClient();
    await expect(client.call('add', 2, 3)).resolves.toBe(5);
  });

  it('settles the pending map after a successful call', async () => {
    const client = createTestClient();
    await client.call('add', 1, 1);
    expect(client.pendingCount).toBe(0);
  });

  it('correlates replies that arrive OUT OF ORDER', async () => {
    // THE KEY TEST. The worker answers the second request first: `slow` waits 120ms, `fast` waits 0, so
    // the replies land in the reverse of the order the requests were posted.
    //
    // A listener-per-call implementation resolves whichever reply arrives first, so `slow` would receive
    // 'fast-value' and `fast` would receive 'slow-value' — both promises resolving, both with the declared
    // type, neither throwing. Asserting only that the two values are "right" is not enough either: that
    // holds under a FIFO mock. So the completion ORDER is asserted too, proving the replies genuinely
    // raced and that each call still received its OWN value.
    const client = createTestClient();
    const settled: string[] = [];

    const slow = client.call('echo', 'slow-value', 120).then((value) => {
      settled.push('slow');
      return value;
    });
    const fast = client.call('echo', 'fast-value', 0).then((value) => {
      settled.push('fast');
      return value;
    });

    expect(client.pendingCount).toBe(2);

    const [slowValue, fastValue] = await Promise.all([slow, fast]);

    expect(settled).toEqual(['fast', 'slow']);
    expect(slowValue).toBe('slow-value');
    expect(fastValue).toBe('fast-value');
    expect(client.pendingCount).toBe(0);
  });

  it('keeps three interleaved calls distinct', async () => {
    // The same property at wider spread: completion order is the exact reverse of request order.
    const client = createTestClient();

    const results = await Promise.all([
      client.call('echo', 'first', 90),
      client.call('echo', 'second', 45),
      client.call('echo', 'third', 0),
    ]);

    expect(results).toEqual(['first', 'second', 'third']);
  });

  it('rejects only the matching call when the worker throws', async () => {
    const client = createTestClient();

    const failing = client.call('boom');
    const succeeding = client.call('add', 20, 22);

    await expect(failing).rejects.toThrow('worker exploded');
    await expect(succeeding).resolves.toBe(42);
    expect(client.pendingCount).toBe(0);
  });

  it('rebuilds a real Error from the worker, preserving name and stack', async () => {
    // A worker-side failure crosses the boundary as plain data — structured clone strips an `Error`'s
    // `stack` and subclass — so the client feeds it back through `toError` from `foundation/errors`.
    const client = createTestClient();

    const error = await captureRejection(client.call('boom'));

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('RangeError');
    expect(error.message).toBe('worker exploded');
    expect(error.stack).toBe('worker.js:1');
  });

  it('rejects on timeout and removes the pending entry', async () => {
    const client = createTestClient();

    await expect(client.callWith({ timeoutMs: 40 }, 'hang')).rejects.toThrow(/timed out/);
    // The leak the pending map exists to avoid: a timed-out entry holds its promise closures forever.
    expect(client.pendingCount).toBe(0);
  });

  it('names a timeout TimeoutError so isTimeoutError recognizes it', async () => {
    const client = createTestClient();

    const error = await captureRejection(client.callWith({ timeoutMs: 40 }, 'hang'));

    expect(error.name).toBe('TimeoutError');
  });

  it('applies a client-level default timeout', async () => {
    const client = createTestClient({ timeoutMs: 40 });
    await expect(client.call('hang')).rejects.toThrow(/timed out/);
  });

  it('lets a per-call timeout override the client default', async () => {
    // The default would fire well before the worker's 80ms reply; the per-call value must win.
    const client = createTestClient({ timeoutMs: 20 });
    await expect(client.callWith({ timeoutMs: 400 }, 'echo', 'slow-but-fine', 80)).resolves.toBe('slow-but-fine');
  });

  it('does not fire a timeout for a call that already settled', async () => {
    const client = createTestClient();
    await expect(client.callWith({ timeoutMs: 300 }, 'add', 1, 2)).resolves.toBe(3);

    // Outlive the deadline; a timer left uncancelled would try to reject an already-settled promise.
    await new Promise((resolve) => {
      setTimeout(resolve, 350);
    });
    expect(client.pendingCount).toBe(0);
  });

  it('rejects every in-flight call on terminate', async () => {
    const client = createTestClient();

    const first = client.call('hang');
    const second = client.call('echo', 'never-arrives', 5_000);
    expect(client.pendingCount).toBe(2);

    client.terminate();

    // Without this, both callers await a thread that no longer exists — forever, with no error to catch.
    await expect(first).rejects.toThrow(/terminated/);
    await expect(second).rejects.toThrow(/terminated/);
    expect(client.pendingCount).toBe(0);
    expect(client.terminated).toBe(true);
  });

  it('rejects a call made after terminate instead of hanging', async () => {
    const client = createTestClient();
    client.terminate();

    await expect(client.call('add', 1, 1)).rejects.toThrow(/terminated/);
  });

  it('is idempotent on repeated terminate', () => {
    const client = createTestClient();
    client.terminate();
    expect(() => {
      client.terminate();
    }).not.toThrow();
  });

  it('ignores foreign traffic on the shared pipe', async () => {
    // The worker posts an untagged object and a bare string before its real reply. Without the channel tag
    // check, one of those would settle the call with garbage.
    const client = createTestClient();
    await expect(client.call('noisy', 'real-result')).resolves.toBe('real-result');
  });

  it('rejects the call when an argument cannot be cloned, rather than throwing synchronously', async () => {
    const client = createTestClient();
    // A function is not structured-cloneable, so `postMessage` throws inline. Routing it to the promise is
    // what lets a caller handle every failure in one place.
    const call = client.callWith({}, 'echo', (() => 'not cloneable') as unknown as string, 0);

    await expect(call).rejects.toThrow();
    expect(client.pendingCount).toBe(0);
  });

  it('rejects everything in flight when the worker itself dies', async () => {
    // A top-level throw is an `ErrorEvent`, which carries no id — nothing says which call provoked it, and
    // the thread is unusable afterwards, so rejecting only a guess would strand the rest.
    const onError = vi.fn();
    const client = createWorkerClient<TestApi>(
      createWorker(`self.onmessage = function () { throw new Error('worker died'); };`),
      { onError },
    );

    const first = client.call('hang');
    const second = client.call('add', 1, 1);

    await expect(first).rejects.toThrow();
    await expect(second).rejects.toThrow();
    expect(client.pendingCount).toBe(0);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe('transferables', () => {
  it('moves a buffer instead of copying it — and NEUTERS the caller’s copy', async () => {
    // The documented surprise, asserted rather than described. Transfer is a MOVE: after the call the
    // sender's own `ArrayBuffer` is zero-length, because the memory now belongs to the worker.
    const client = createTestClient();
    const buffer = new ArrayBuffer(2_048);
    expect(buffer.byteLength).toBe(2_048);

    const lengthOnWorker = await client.callWith({ transfer: [buffer] }, 'byteLength', buffer);

    expect(lengthOnWorker).toBe(2_048);
    expect(buffer.byteLength).toBe(0);
  });

  it('leaves the caller’s buffer intact when it is cloned rather than transferred', async () => {
    // The control case that gives the assertion above its meaning: without a transfer list, the same call
    // copies, and the caller keeps a usable buffer.
    const client = createTestClient();
    const buffer = new ArrayBuffer(2_048);

    await expect(client.call('byteLength', buffer)).resolves.toBe(2_048);
    expect(buffer.byteLength).toBe(2_048);
  });
});

describe('useWorker', () => {
  it('exposes a working client after mount', async () => {
    const { result } = renderHook(() => useWorker<TestApi>(() => createWorker()));

    await waitFor(() => {
      expect(result.current.client).not.toBeNull();
    });
    expect(result.current.supported).toBe(true);
    await expect(result.current.client?.call('add', 4, 5)).resolves.toBe(9);
  });

  it('TERMINATES the worker on unmount', async () => {
    // A `Worker` is an OS thread and is not garbage-collected when its last reference drops, so a missing
    // cleanup leaks a live thread per mount. The spy is on the real worker instance.
    const worker = createWorker();
    const terminateSpy = vi.spyOn(worker, 'terminate');

    const { result, unmount } = renderHook(() => useWorker<TestApi>(() => worker));
    await waitFor(() => {
      expect(result.current.client).not.toBeNull();
    });

    expect(terminateSpy).not.toHaveBeenCalled();
    unmount();
    expect(terminateSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects calls left in flight at unmount', async () => {
    const { result, unmount } = renderHook(() => useWorker<TestApi>(() => createWorker()));
    await waitFor(() => {
      expect(result.current.client).not.toBeNull();
    });

    const client = result.current.client;
    const pending = client?.call('hang');
    unmount();

    // The await parked on an unmounted component gets an error rather than hanging for the session.
    await expect(pending).rejects.toThrow(/terminated/);
  });

  it('does not respawn the worker when the factory identity changes every render', async () => {
    // The guard the empty deps + ref pairing exists for: the natural call site passes an inline arrow, so
    // a `[factory]` dependency would tear down and rebuild the thread on every single render.
    const factory = vi.fn(() => createWorker());
    const { result, rerender } = renderHook(() => useWorker<TestApi>(() => factory()));

    await waitFor(() => {
      expect(result.current.client).not.toBeNull();
    });
    const initialClient = result.current.client;

    rerender();
    rerender();
    rerender();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(result.current.client).toBe(initialClient);
  });
});

describe('runInWorker', () => {
  it('runs a self-contained function on a throwaway thread', async () => {
    const result = await runInWorker((a: number, b: number) => a + b, [2, 3]);

    expect(result.status).toBe('ok');
    expect(result.status === 'ok' && result.value).toBe(5);
  });

  it('passes structured-cloneable arguments through', async () => {
    const result = await runInWorker((rows: number[]) => rows.reduce((total, row) => total + row, 0), [[1, 2, 3, 4]]);

    expect(result.status === 'ok' && result.value).toBe(10);
  });

  it('reports a thrown function as failed rather than throwing', async () => {
    const result = await runInWorker(() => {
      throw new Error('inside the worker');
    }, []);

    expect(result.status).toBe('failed');
    expect(result.status === 'failed' && result.error.message).toBe('inside the worker');
  });

  it('FAILS when the function closes over anything, because it is stringified', async () => {
    // The trap, made executable. `factor` is plainly in scope at the call site and TypeScript is perfectly
    // happy, but `Function.prototype.toString` returns source text, not a closure — so the worker evaluates
    // the body in a scope where `factor` was never declared.
    let factor = 0;
    factor = Number('3');

    const result = await runInWorker((value: number) => value * factor, [7]);

    expect(result.status).toBe('failed');
    expect(result.status === 'failed' && result.error.message).toMatch(/factor/);
  });

  it('honours a timeout', async () => {
    const result = await runInWorker(() => {
      // A busy spin, since a blob worker has no way to be interrupted politely.
      const until = Date.now() + 1_000;
      while (Date.now() < until) {
        /* block the worker thread */
      }
      return 'too late';
    }, [], { timeoutMs: 50 });

    expect(result.status).toBe('failed');
    expect(result.status === 'failed' && result.error.name).toBe('TimeoutError');
  });
});
