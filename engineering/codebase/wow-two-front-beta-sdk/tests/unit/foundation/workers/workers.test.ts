// Node project — everything in this slice that does NOT need a real thread.
//
// Two groups live here. The protocol helpers are pure functions over plain objects, so a browser would add
// nothing. `exposeWorkerApi` is here for a less obvious reason: its scope parameter is structurally typed
// precisely so the host can be driven without a worker, and a stub scope exercises the dispatch table far
// more sharply than a real one — an unknown method, a rejected handler, and above all a `postMessage` that
// THROWS (the non-cloneable-result case) are all trivial to stage here and awkward to stage in chromium.
//
// The real-thread behaviours — correlation under out-of-order replies, timeouts, termination, transfer
// neutering, the React lifetime — are in `workers.browser.test.ts`, because each of them is a claim about
// what an actual `Worker` does and a stub could only prove the mock agrees with itself.
//
// `isWorkerSupported` returning false here is not an accident of the environment being wrong: Node has no
// `Worker` global (its threads live behind `node:worker_threads`), which makes this project a faithful
// stand-in for SSR and lets the never-throw-at-import contract be asserted rather than asserted-about.

import { describe, expect, it, vi } from 'vitest';

import {
  createFailureMessage,
  createRequestIdAllocator,
  createRequestMessage,
  createSuccessMessage,
  exposeWorkerApi,
  isBlobWorkerSupported,
  isWorkerRequestMessage,
  isWorkerResponseMessage,
  isWorkerSupported,
  runInWorker,
  withTransfer,
  WorkerMessageChannel,
  type WorkerResponseMessage,
  type WorkerScope,
} from '@src/foundation/workers';

/** Casts a payload into the only member of a `MessageEvent` the host reads, avoiding a dependency on the global. */
function messageEvent(data: unknown): MessageEvent {
  return { data } as unknown as MessageEvent;
}

/** Drains microtasks AND the timer queue, so a handler awaiting either has finished before an assertion runs. */
async function flush(): Promise<void> {
  for (let index = 0; index < 3; index += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
}

/** Stands in for a worker's global scope: records every reply and lets a test push a message in. */
class ScopeStub implements WorkerScope {
  /** Every message the host posted, in order. */
  readonly messages: unknown[] = [];

  /** The transfer list passed alongside each message, aligned by index with {@link ScopeStub.messages}. */
  readonly transfers: (Transferable[] | undefined)[] = [];

  /** Makes the next `postMessage` throw — stages the non-cloneable-result path. */
  failNextPost = false;

  private listener: ((event: MessageEvent) => void) | undefined;

  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void {
    this.listener = listener;
  }

  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void {
    if (this.listener === listener) this.listener = undefined;
  }

  postMessage(message: unknown, transfer?: Transferable[]): void {
    if (this.failNextPost) {
      this.failNextPost = false;
      throw new DOMException('could not be cloned', 'DataCloneError');
    }
    this.messages.push(message);
    this.transfers.push(transfer);
  }

  /** Whether a listener is currently registered — the observable a disposer test needs. */
  get subscribed(): boolean {
    return this.listener !== undefined;
  }

  /** Delivers a message to the host and waits for the reply it produces. */
  async deliver(data: unknown): Promise<void> {
    this.listener?.(messageEvent(data));
    await flush();
  }

  /** Reads the reply at `index`, narrowed — the guard doubles as an assertion that a reply was posted at all. */
  replyAt(index: number): WorkerResponseMessage {
    const message = this.messages.at(index);
    if (!isWorkerResponseMessage(message)) throw new Error(`No RPC reply at index ${index}`);
    return message;
  }
}

/** Builds a well-formed request, so each test states only the parts it cares about. */
function request(id: number, method: string, args: readonly unknown[] = []): unknown {
  return createRequestMessage(id, method, args);
}

describe('createRequestIdAllocator', () => {
  it('starts at 1 so no real call is ever identified by a falsy id', () => {
    const nextId = createRequestIdAllocator();
    expect(nextId()).toBe(1);
  });

  it('increases monotonically', () => {
    const nextId = createRequestIdAllocator();
    expect([nextId(), nextId(), nextId(), nextId()]).toEqual([1, 2, 3, 4]);
  });

  it('gives each allocator an independent sequence, so two clients cannot collide through a shared counter', () => {
    const first = createRequestIdAllocator();
    const second = createRequestIdAllocator();

    first();
    first();

    expect(second()).toBe(1);
    expect(first()).toBe(3);
  });
});

describe('message guards', () => {
  it('accepts a well-formed request', () => {
    expect(isWorkerRequestMessage(createRequestMessage(1, 'add', [2, 3]))).toBe(true);
  });

  it('accepts a well-formed success reply', () => {
    expect(isWorkerResponseMessage(createSuccessMessage(1, 42))).toBe(true);
  });

  it('accepts a well-formed failure reply', () => {
    expect(isWorkerResponseMessage(createFailureMessage(1, { name: 'Error', message: 'nope' }))).toBe(true);
  });

  it('accepts a success reply whose result is undefined, so a void method still resolves', () => {
    // The reason `ok` is an explicit flag rather than an `'error' in message` probe: after a structured
    // clone an absent `result` and an `undefined` one are the same thing, and both must mean success.
    const reply = { channel: WorkerMessageChannel, kind: 'response', id: 7, ok: true };
    expect(isWorkerResponseMessage(reply)).toBe(true);
  });

  it('rejects a failure reply carrying no error payload', () => {
    const reply = { channel: WorkerMessageChannel, kind: 'response', id: 7, ok: false };
    expect(isWorkerResponseMessage(reply)).toBe(false);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'add'],
    ['a number', 7],
    ['an untagged object', { kind: 'request', id: 1, method: 'add', args: [] }],
    ['a foreign channel', { channel: 'other-library', kind: 'request', id: 1, method: 'add', args: [] }],
    ['a missing id', { channel: WorkerMessageChannel, kind: 'request', method: 'add', args: [] }],
    ['a non-array args', { channel: WorkerMessageChannel, kind: 'request', id: 1, method: 'add', args: 'x' }],
  ])('rejects %s as a request', (_label, value) => {
    expect(isWorkerRequestMessage(value)).toBe(false);
  });

  it.each([
    ['a request envelope', createRequestMessage(1, 'add', [])],
    ['a foreign reply', { channel: 'other-library', kind: 'response', id: 1, ok: true, result: 1 }],
    ['an HMR-shaped ping', { type: 'vite:beforeUpdate' }],
  ])('rejects %s as a reply, so a shared pipe cannot settle a call by accident', (_label, value) => {
    expect(isWorkerResponseMessage(value)).toBe(false);
  });
});

describe('exposeWorkerApi', () => {
  it('dispatches to a sync handler and replies with its value', async () => {
    const scope = new ScopeStub();
    exposeWorkerApi({ add: (a: number, b: number) => a + b }, scope);

    await scope.deliver(request(1, 'add', [2, 3]));

    const reply = scope.replyAt(0);
    expect(reply.ok).toBe(true);
    expect(reply.ok && reply.result).toBe(5);
    expect(reply.id).toBe(1);
  });

  it('awaits an async handler before replying', async () => {
    const scope = new ScopeStub();
    exposeWorkerApi(
      {
        slow: async (value: string) => {
          await new Promise((resolve) => {
            setTimeout(resolve, 1);
          });
          return `${value}!`;
        },
      },
      scope,
    );

    await scope.deliver(request(1, 'slow', ['hi']));

    const reply = scope.replyAt(0);
    expect(reply.ok && reply.result).toBe('hi!');
  });

  it('echoes the request id, which is what lets the client correlate at all', async () => {
    const scope = new ScopeStub();
    exposeWorkerApi({ identity: (value: number) => value }, scope);

    await scope.deliver(request(99, 'identity', [1]));

    expect(scope.replyAt(0).id).toBe(99);
  });

  it('replies with a failure when the handler throws, rather than letting the call hang', async () => {
    const scope = new ScopeStub();
    exposeWorkerApi(
      {
        boom: () => {
          throw new RangeError('out of range');
        },
      },
      scope,
    );

    await scope.deliver(request(1, 'boom'));

    const reply = scope.replyAt(0);
    expect(reply.ok).toBe(false);
    expect(!reply.ok && reply.error.name).toBe('RangeError');
    expect(!reply.ok && reply.error.message).toBe('out of range');
  });

  it('replies with a failure when an async handler rejects', async () => {
    const scope = new ScopeStub();
    exposeWorkerApi({ boom: () => Promise.reject(new Error('async failure')) }, scope);

    await scope.deliver(request(1, 'boom'));

    const reply = scope.replyAt(0);
    expect(!reply.ok && reply.error.message).toBe('async failure');
  });

  it('replies with a failure naming an unknown method, instead of killing the worker', async () => {
    const scope = new ScopeStub();
    exposeWorkerApi({ add: (a: number, b: number) => a + b }, scope);

    await scope.deliver(request(1, 'subtract', [2, 3]));

    const reply = scope.replyAt(0);
    expect(reply.ok).toBe(false);
    expect(!reply.ok && reply.error.message).toContain('subtract');
  });

  it('does not treat an inherited Object member as a handler', async () => {
    const scope = new ScopeStub();
    exposeWorkerApi({ add: (a: number, b: number) => a + b }, scope);

    // `handlers['toString']` resolves through the prototype to a real function, so a `typeof === 'function'`
    // check on a raw lookup would happily invoke it and reply with `[object Object]`.
    await scope.deliver(request(1, 'toString'));

    const reply = scope.replyAt(0);
    expect(reply.ok).toBe(false);
    expect(!reply.ok && reply.error.message).toContain('toString');
  });

  it('replies with a failure when posting the RESULT throws, which would otherwise hang the call forever', async () => {
    // The non-cloneable-result path: the handler succeeded, so nothing in it can catch this, yet the
    // client's pending entry is already open and only a reply releases it.
    const scope = new ScopeStub();
    exposeWorkerApi({ build: () => ({ nested: true }) }, scope);
    scope.failNextPost = true;

    await scope.deliver(request(1, 'build'));

    const reply = scope.replyAt(0);
    expect(reply.ok).toBe(false);
    expect(!reply.ok && reply.error.name).toBe('DataCloneError');
    expect(reply.id).toBe(1);
  });

  it('unwraps withTransfer, sending the plain value and the transfer list separately', async () => {
    const scope = new ScopeStub();
    const buffer = new ArrayBuffer(8);
    exposeWorkerApi({ render: () => withTransfer(buffer, [buffer]) }, scope);

    await scope.deliver(request(1, 'render'));

    const reply = scope.replyAt(0);
    // The wrapper is a host-side marker only — the client must receive the value itself.
    expect(reply.ok && reply.result).toBe(buffer);
    expect(scope.transfers.at(0)).toEqual([buffer]);
  });

  it('stays silent on a message that is not ours, because the pipe is shared', async () => {
    const scope = new ScopeStub();
    const handler = vi.fn(() => 'never');
    exposeWorkerApi({ work: handler }, scope);

    await scope.deliver({ type: 'vite:beforeUpdate', updates: [] });
    await scope.deliver({ id: 1, method: 'work', args: [] });

    expect(handler).not.toHaveBeenCalled();
    expect(scope.messages).toHaveLength(0);
  });

  it('stops dispatching once the disposer runs', async () => {
    const scope = new ScopeStub();
    const dispose = exposeWorkerApi({ add: (a: number, b: number) => a + b }, scope);

    expect(scope.subscribed).toBe(true);
    dispose();
    expect(scope.subscribed).toBe(false);

    await scope.deliver(request(1, 'add', [2, 3]));
    expect(scope.messages).toHaveLength(0);
  });

  it('registers nothing and returns a working no-op when there is no worker scope', () => {
    // The main-thread / SSR accident: a worker module pulled into the wrong chunk must be inert, not fatal.
    const dispose = exposeWorkerApi({ add: (a: number, b: number) => a + b }, null);
    expect(() => {
      dispose();
    }).not.toThrow();
  });
});

describe('capability probes under SSR', () => {
  it('reports no Worker in a Node runtime', () => {
    // Node's threads live behind `node:worker_threads`, so the browser global is genuinely absent here —
    // this project is a faithful stand-in for a server render.
    expect(isWorkerSupported()).toBe(false);
    expect(isBlobWorkerSupported()).toBe(false);
  });

  it('answers unsupported from runInWorker instead of throwing', async () => {
    const result = await runInWorker((value: number) => value * 2, [21]);
    expect(result.status).toBe('unsupported');
  });
});
