import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BackoffStrategy,
  JitterStrategy,
  computeRetryDelay,
  type RetryPolicy,
} from '@src/foundation/resilience';
import {
  ConnectionState,
  EventSourceReadyState,
  PollerState,
  ReconnectOwner,
  SocketReadyState,
  createEventStream,
  createPoller,
  createSocketClient,
  readOnlineStatus,
  waitForOnline,
  type EventStreamSource,
  type EventStreamSourceFactory,
  type SocketConnection,
  type SocketFactory,
} from '@src/foundation/net';

// These run in vitest's `node` environment: there is genuinely no `window`, no `document`, and no
// `EventSource`, so the SSR / unsupported paths are the real default and need no mocking at all. Everything
// else is driven through the slice's injection seams (`eventSource`, `socket`) rather than by patching
// globals, because a hand-written double can do what a real transport cannot — fail on command, report an
// exact `readyState`, and reject a `send()` the way a `CONNECTING` `WebSocket` really does.
//
// The doubles deliberately reproduce the platform's hostile behaviour instead of a convenient version of it.
// `FakeSocket.send` THROWS while connecting, so the send-queue test would fail loudly if the queue were
// removed, and `FakeSocket.close` dispatches `close` SYNCHRONOUSLY, so the "intentional close must not
// reconnect" test exercises the tightest possible ordering against the `closedByCaller` flag.
//
// Backoff assertions never hardcode a number. Each expected delay is computed by calling
// `computeRetryDelay` — the same function the slice uses — with the same policy and the same pinned
// `random`. A test that hardcoded `1000` would still pass if the slice grew its own private backoff, which
// is precisely the regression worth catching.

/** The pinned randomness for every backoff assertion — jitter is off in the test policies, but the seam is exercised. */
const fixedRandom = (): number => 0.5;

/** A deterministic reconnect policy: exponential from 1s, no jitter, so delays are exactly reproducible. */
const testRetryPolicy: RetryPolicy = {
  maxRetries: 5,
  backoff: BackoffStrategy.Exponential,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  jitter: JitterStrategy.None,
};

/** Reads the last element of an array without a non-null assertion (`noUncheckedIndexedAccess`). */
function lastOf<T>(items: readonly T[]): T {
  const item = items.at(-1);
  if (item === undefined) throw new Error('Expected at least one recorded item.');
  return item;
}

/** Tracks listeners by type so a test can both dispatch to them and assert they were all removed. */
class ListenerRegistry {
  private readonly listeners = new Map<string, Set<(event: Event) => void>>();

  /** Registers a listener under a type. */
  add(type: string, listener: (event: Event) => void): void {
    const set = this.listeners.get(type) ?? new Set<(event: Event) => void>();
    set.add(listener);
    this.listeners.set(type, set);
  }

  /** Removes a listener. */
  remove(type: string, listener: (event: Event) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  /** Dispatches to every listener of a type; the copy guards against a handler detaching mid-dispatch. */
  emit(type: string, event: unknown = {}): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event as Event);
  }

  /** The total live listener count — the leak assertion. */
  get size(): number {
    let total = 0;
    for (const set of this.listeners.values()) total += set.size;
    return total;
  }
}

/** A minimal `EventSource` double with a caller-controlled `readyState` — the branch the reconnect guard turns on. */
class FakeEventSource implements EventStreamSource {
  readyState: number = EventSourceReadyState.Connecting;
  closeCalls = 0;
  readonly registry = new ListenerRegistry();

  constructor(
    readonly url: string,
    readonly init: { withCredentials: boolean },
  ) {}

  addEventListener(type: string, listener: (event: Event) => void): void {
    this.registry.add(type, listener);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.registry.remove(type, listener);
  }

  close(): void {
    this.closeCalls += 1;
    this.readyState = EventSourceReadyState.Closed;
  }

  /** Simulates a successful connection. */
  open(): void {
    this.readyState = EventSourceReadyState.Open;
    this.registry.emit('open');
  }

  /** Simulates a drop the BROWSER is retrying by itself — `readyState` back to `CONNECTING`. */
  failRecoverably(): void {
    this.readyState = EventSourceReadyState.Connecting;
    this.registry.emit('error');
  }

  /** Simulates a failure the browser has abandoned — `readyState` terminal at `CLOSED`. */
  failFatally(): void {
    this.readyState = EventSourceReadyState.Closed;
    this.registry.emit('error');
  }

  /** Delivers a frame of the given event type. */
  deliver(type: string, data: string): void {
    this.registry.emit(type, { data });
  }
}

/** Records every `EventSource` the slice builds, so a test can count reconnections. */
function eventSourceHarness(): { created: FakeEventSource[]; factory: EventStreamSourceFactory } {
  const created: FakeEventSource[] = [];
  return {
    created,
    factory: (url, init) => {
      const source = new FakeEventSource(url, init);
      created.push(source);
      return source;
    },
  };
}

/** A `WebSocket` double that throws on a send before `OPEN`, exactly as the platform does. */
class FakeSocket implements SocketConnection {
  readyState: number = SocketReadyState.Connecting;
  readonly sent: string[] = [];
  closeCalls = 0;
  readonly registry = new ListenerRegistry();

  constructor(
    readonly url: string,
    readonly protocols?: string | readonly string[],
  ) {}

  addEventListener(type: string, listener: (event: Event) => void): void {
    this.registry.add(type, listener);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.registry.remove(type, listener);
  }

  send(data: string): void {
    // The platform's real behaviour, and the reason the send queue exists.
    if (this.readyState !== SocketReadyState.Open) throw new Error('InvalidStateError: still CONNECTING');
    this.sent.push(data);
  }

  close(): void {
    this.closeCalls += 1;
    if (this.readyState === SocketReadyState.Closed) return;
    this.readyState = SocketReadyState.Closed;
    // Synchronous on purpose — the tightest ordering the `closedByCaller` guard has to survive.
    this.registry.emit('close', { wasClean: true, code: 1000 });
  }

  /** Completes the handshake. */
  open(): void {
    this.readyState = SocketReadyState.Open;
    this.registry.emit('open');
  }

  /** Simulates a network drop — a close the caller did not ask for. */
  drop(): void {
    this.readyState = SocketReadyState.Closed;
    this.registry.emit('close', { wasClean: false, code: 1006 });
  }

  /** Delivers an inbound text frame. */
  deliver(data: string): void {
    this.registry.emit('message', { data });
  }
}

/** Records every socket the slice builds, so a test can count reconnections. */
function socketHarness(): { created: FakeSocket[]; factory: SocketFactory } {
  const created: FakeSocket[] = [];
  return {
    created,
    factory: (url, protocols) => {
      const socket = new FakeSocket(url, protocols);
      created.push(socket);
      return socket;
    },
  };
}

/** A fake `window` / `document` / `navigator` triple, with listener counts for the leak assertions. */
interface DomHarness {
  /** Flips `navigator.onLine` and dispatches the matching window event. */
  setOnline(online: boolean): void;
  /** Flips `document.visibilityState` and dispatches `visibilitychange`. */
  setHidden(hidden: boolean): void;
  /** Live `window` listeners — must return to `0` after every disposer runs. */
  windowListeners(): number;
  /** Live `document` listeners — must return to `0` after every disposer runs. */
  documentListeners(): number;
  /** Removes all three globals. */
  restore(): void;
}

/** Installs the fake DOM globals the poller and liveness helpers read. */
function installDom(initial: { online?: boolean; hidden?: boolean } = {}): DomHarness {
  const windowRegistry = new ListenerRegistry();
  const documentRegistry = new ListenerRegistry();
  const state = { online: initial.online ?? true, hidden: initial.hidden ?? false };

  const fakeWindow = {
    addEventListener: (type: string, listener: (event: Event) => void) => windowRegistry.add(type, listener),
    removeEventListener: (type: string, listener: (event: Event) => void) => windowRegistry.remove(type, listener),
  };

  const fakeDocument = {
    get visibilityState() {
      return state.hidden ? 'hidden' : 'visible';
    },
    addEventListener: (type: string, listener: (event: Event) => void) => documentRegistry.add(type, listener),
    removeEventListener: (type: string, listener: (event: Event) => void) => documentRegistry.remove(type, listener),
  };

  const globals = globalThis as { window?: unknown; document?: unknown; navigator?: unknown };
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

  globals.window = fakeWindow;
  globals.document = fakeDocument;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    get: () => ({ onLine: state.online }),
  });

  return {
    setOnline(online: boolean): void {
      state.online = online;
      windowRegistry.emit(online ? 'online' : 'offline');
    },
    setHidden(hidden: boolean): void {
      state.hidden = hidden;
      documentRegistry.emit('visibilitychange');
    },
    windowListeners: () => windowRegistry.size,
    documentListeners: () => documentRegistry.size,
    restore(): void {
      delete globals.window;
      delete globals.document;
      if (originalNavigator !== undefined) Object.defineProperty(globalThis, 'navigator', originalNavigator);
      else delete globals.navigator;
    },
  };
}

/** Removes a global for the duration of a callback — used for the "no `WebSocket`" (SSR) path. */
function withoutGlobal(name: 'WebSocket' | 'EventSource', run: () => void): void {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: undefined });
  try {
    run();
  } finally {
    if (original !== undefined) Object.defineProperty(globalThis, name, original);
    else delete (globalThis as Record<string, unknown>)[name];
  }
}

let dom: DomHarness | undefined;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  // Restore in the reverse order of installation so no test leaks a fake global (or a live timer) into the
  // next — the fake `window` in particular would break every SSR assertion that follows.
  dom?.restore();
  dom = undefined;
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('createEventStream — the double-reconnect guard', () => {
  it('stands down while the browser is retrying (readyState CONNECTING)', () => {
    const { created, factory } = eventSourceHarness();
    const owners: ReconnectOwner[] = [];
    const stream = createEventStream('/sse', {
      eventSource: factory,
      retry: testRetryPolicy,
      random: fixedRandom,
      onError: (_error, context) => owners.push(context.owner),
    });

    lastOf(created).open();
    lastOf(created).failRecoverably();

    // The whole point: no second EventSource, and no wrapper timer competing with the browser's own retry.
    expect(created).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(owners).toEqual([ReconnectOwner.Browser]);
    expect(stream.readyState).toBe(ConnectionState.Reconnecting);
    expect(stream.attempts).toBe(0);

    stream.close();
  });

  it('takes over once the browser gives up (readyState CLOSED)', async () => {
    const { created, factory } = eventSourceHarness();
    const owners: ReconnectOwner[] = [];
    const stream = createEventStream('/sse', {
      eventSource: factory,
      retry: testRetryPolicy,
      random: fixedRandom,
      onError: (_error, context) => owners.push(context.owner),
    });

    lastOf(created).open();
    lastOf(created).failFatally();

    expect(owners).toEqual([ReconnectOwner.Wrapper]);
    expect(stream.readyState).toBe(ConnectionState.Reconnecting);
    expect(created).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(computeRetryDelay(testRetryPolicy, 1, 0, fixedRandom));
    expect(created).toHaveLength(2);

    stream.close();
  });

  it('detaches the dead source before replacing it, so no listener survives it', async () => {
    const { created, factory } = eventSourceHarness();
    const stream = createEventStream('/sse', {
      eventSource: factory,
      retry: testRetryPolicy,
      random: fixedRandom,
      onMessage: () => undefined,
    });

    const first = lastOf(created);
    first.open();
    first.failFatally();
    await vi.advanceTimersByTimeAsync(computeRetryDelay(testRetryPolicy, 1, 0, fixedRandom));

    expect(first.registry.size).toBe(0);
    expect(first.closeCalls).toBeGreaterThan(0);
    expect(created).toHaveLength(2);

    stream.close();
  });
});

describe('createEventStream — backoff comes from foundation/resilience', () => {
  it('waits exactly computeRetryDelay for each successive attempt', async () => {
    const { created, factory } = eventSourceHarness();
    const stream = createEventStream('/sse', {
      eventSource: factory,
      retry: testRetryPolicy,
      random: fixedRandom,
    });

    lastOf(created).failFatally();
    const firstDelay = computeRetryDelay(testRetryPolicy, 1, 0, fixedRandom);

    // One tick short of the computed delay, nothing has happened yet.
    await vi.advanceTimersByTimeAsync(firstDelay - 1);
    expect(created).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(created).toHaveLength(2);

    lastOf(created).failFatally();
    const secondDelay = computeRetryDelay(testRetryPolicy, 2, firstDelay, fixedRandom);
    expect(secondDelay).toBeGreaterThan(firstDelay);

    await vi.advanceTimersByTimeAsync(secondDelay - 1);
    expect(created).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(created).toHaveLength(3);

    stream.close();
  });

  it('zeroes the attempt counter on a successful open', async () => {
    const { created, factory } = eventSourceHarness();
    const stream = createEventStream('/sse', {
      eventSource: factory,
      retry: testRetryPolicy,
      random: fixedRandom,
    });

    lastOf(created).failFatally();
    expect(stream.attempts).toBe(1);

    await vi.advanceTimersByTimeAsync(computeRetryDelay(testRetryPolicy, 1, 0, fixedRandom));
    lastOf(created).open();
    expect(stream.attempts).toBe(0);

    // Having reset, the NEXT failure must wait the base delay again, not the escalated one.
    lastOf(created).failFatally();
    await vi.advanceTimersByTimeAsync(computeRetryDelay(testRetryPolicy, 1, 0, fixedRandom));
    expect(created).toHaveLength(3);

    stream.close();
  });

  it('stops for good once the attempt budget is spent', async () => {
    const { created, factory } = eventSourceHarness();
    const budget: RetryPolicy = { ...testRetryPolicy, maxRetries: 2 };
    const owners: ReconnectOwner[] = [];
    const stream = createEventStream('/sse', {
      eventSource: factory,
      retry: budget,
      random: fixedRandom,
      onError: (_error, context) => owners.push(context.owner),
    });

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      lastOf(created).failFatally();
      await vi.advanceTimersByTimeAsync(60_000);
    }

    expect(created).toHaveLength(3);
    expect(owners.at(-1)).toBe(ReconnectOwner.None);
    expect(stream.readyState).toBe(ConnectionState.Closed);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never reconnects when retry is disabled', async () => {
    const { created, factory } = eventSourceHarness();
    const stream = createEventStream('/sse', { eventSource: factory, retry: false });

    lastOf(created).failFatally();
    await vi.advanceTimersByTimeAsync(120_000);

    expect(created).toHaveLength(1);
    expect(stream.readyState).toBe(ConnectionState.Closed);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('createEventStream — events and parsing', () => {
  it('routes named events to their own handlers, never to onMessage', () => {
    const { created, factory } = eventSourceHarness();
    const named: unknown[] = [];
    const unnamed: unknown[] = [];
    const stream = createEventStream<{ 'order-updated': { id: number } }>('/sse', {
      eventSource: factory,
      events: { 'order-updated': (data) => named.push(data) },
      onMessage: (data) => unnamed.push(data),
    });

    const source = lastOf(created);
    source.open();
    source.deliver('order-updated', '{"id":7}');
    source.deliver('message', '{"id":9}');

    expect(named).toEqual([{ id: 7 }]);
    expect(unnamed).toEqual([{ id: 9 }]);

    stream.close();
  });

  it('falls back to the raw text when a frame is not JSON', () => {
    const { created, factory } = eventSourceHarness();
    const received: unknown[] = [];
    const stream = createEventStream('/sse', { eventSource: factory, onMessage: (data) => received.push(data) });

    lastOf(created).deliver('message', '[DONE]');
    expect(received).toEqual(['[DONE]']);

    stream.close();
  });

  it('reports an unsupported answer instead of throwing when EventSource is absent', () => {
    // node has no `EventSource` at all, so this is the genuine SSR path with nothing mocked.
    expect(typeof EventSource).toBe('undefined');
    const stream = createEventStream('/sse');

    expect(stream.supported).toBe(false);
    expect(stream.readyState).toBe(ConnectionState.Closed);
    expect(() => stream.close()).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('createEventStream — disposal', () => {
  it('an intentional close does NOT reconnect and leaks nothing', async () => {
    const { created, factory } = eventSourceHarness();
    const stream = createEventStream('/sse', {
      eventSource: factory,
      retry: testRetryPolicy,
      random: fixedRandom,
      onMessage: () => undefined,
    });

    const source = lastOf(created);
    source.open();
    expect(source.registry.size).toBeGreaterThan(0);

    stream.close();

    expect(stream.readyState).toBe(ConnectionState.Closed);
    expect(source.closeCalls).toBe(1);
    expect(source.registry.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);

    // Nothing may bring it back: neither time, nor a late error from the old source.
    source.failFatally();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(created).toHaveLength(1);
  });

  it('a close during a pending reconnect cancels the pending attempt', async () => {
    const { created, factory } = eventSourceHarness();
    const stream = createEventStream('/sse', {
      eventSource: factory,
      retry: testRetryPolicy,
      random: fixedRandom,
    });

    lastOf(created).failFatally();
    expect(vi.getTimerCount()).toBe(1);

    stream.close();
    expect(vi.getTimerCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(120_000);
    expect(created).toHaveLength(1);
  });

  it('close is idempotent', () => {
    const { created, factory } = eventSourceHarness();
    const stream = createEventStream('/sse', { eventSource: factory });

    stream.close();
    stream.close();

    expect(lastOf(created).closeCalls).toBe(1);
  });
});

describe('createSocketClient — the send queue', () => {
  it('queues messages sent while CONNECTING and flushes them, in order, on open', () => {
    const { created, factory } = socketHarness();
    const client = createSocketClient<unknown, { n: number }>('/ws', { socket: factory });
    const socket = lastOf(created);

    expect(client.readyState).toBe(ConnectionState.Connecting);
    expect(client.send({ n: 1 })).toBe(false);
    expect(client.send({ n: 2 })).toBe(false);
    expect(client.queuedCount).toBe(2);
    expect(socket.sent).toEqual([]);

    socket.open();

    expect(socket.sent).toEqual(['{"n":1}', '{"n":2}']);
    expect(client.queuedCount).toBe(0);
    expect(client.send({ n: 3 })).toBe(true);
    expect(socket.sent).toHaveLength(3);

    client.close();
  });

  it('drops the oldest frame once the queue limit is reached', () => {
    const { created, factory } = socketHarness();
    const client = createSocketClient<unknown, number>('/ws', { socket: factory, queueLimit: 2 });

    client.send(1);
    client.send(2);
    client.send(3);
    expect(client.queuedCount).toBe(2);

    lastOf(created).open();
    expect(lastOf(created).sent).toEqual(['2', '3']);

    client.close();
  });

  it('re-queues across a reconnect, so an outage loses nothing under the cap', async () => {
    const { created, factory } = socketHarness();
    const client = createSocketClient<unknown, string>('/ws', {
      socket: factory,
      retry: testRetryPolicy,
      random: fixedRandom,
    });

    lastOf(created).open();
    lastOf(created).drop();
    expect(client.readyState).toBe(ConnectionState.Reconnecting);

    client.send('while-down');
    expect(client.queuedCount).toBe(1);

    await vi.advanceTimersByTimeAsync(computeRetryDelay(testRetryPolicy, 1, 0, fixedRandom));
    expect(created).toHaveLength(2);
    lastOf(created).open();

    expect(lastOf(created).sent).toEqual(['"while-down"']);

    client.close();
  });
});

describe('createSocketClient — heartbeat', () => {
  it('reconnects when the pong deadline lapses on a half-open socket', async () => {
    const { created, factory } = socketHarness();
    const client = createSocketClient('/ws', {
      socket: factory,
      heartbeat: { intervalMs: 1_000, timeoutMs: 500 },
      retry: testRetryPolicy,
      random: fixedRandom,
    });

    const socket = lastOf(created);
    socket.open();

    await vi.advanceTimersByTimeAsync(1_000);
    expect(socket.sent).toEqual(['{"type":"ping"}']);
    expect(created).toHaveLength(1);

    // Silence past the deadline: the socket still claims OPEN, but it is dead.
    await vi.advanceTimersByTimeAsync(500);
    expect(socket.closeCalls).toBe(1);
    expect(client.readyState).toBe(ConnectionState.Reconnecting);

    await vi.advanceTimersByTimeAsync(computeRetryDelay(testRetryPolicy, 1, 0, fixedRandom));
    expect(created).toHaveLength(2);

    client.close();
  });

  it('treats any inbound frame as proof of life, so a busy socket is never recycled', async () => {
    const { created, factory } = socketHarness();
    const client = createSocketClient('/ws', {
      socket: factory,
      heartbeat: { intervalMs: 1_000, timeoutMs: 500 },
      retry: testRetryPolicy,
      random: fixedRandom,
      onMessage: () => undefined,
    });

    const socket = lastOf(created);
    socket.open();

    await vi.advanceTimersByTimeAsync(1_000);
    socket.deliver('{"kind":"anything"}');
    await vi.advanceTimersByTimeAsync(500);

    expect(socket.closeCalls).toBe(0);
    expect(created).toHaveLength(1);
    expect(client.readyState).toBe(ConnectionState.Open);

    client.close();
  });

  it('sends the caller-supplied ping frame', async () => {
    const { created, factory } = socketHarness();
    const client = createSocketClient('/ws', {
      socket: factory,
      heartbeat: { intervalMs: 1_000, ping: () => 'PING' },
    });

    lastOf(created).open();
    await vi.advanceTimersByTimeAsync(1_000);

    expect(lastOf(created).sent).toEqual(['PING']);
    client.close();
  });
});

describe('createSocketClient — disposal', () => {
  it('an intentional close does NOT reconnect and leaks nothing', async () => {
    const { created, factory } = socketHarness();
    const client = createSocketClient('/ws', {
      socket: factory,
      heartbeat: { intervalMs: 1_000, timeoutMs: 500 },
      retry: testRetryPolicy,
      random: fixedRandom,
      onMessage: () => undefined,
    });

    const socket = lastOf(created);
    socket.open();
    expect(socket.registry.size).toBeGreaterThan(0);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    client.close();

    expect(client.readyState).toBe(ConnectionState.Closed);
    expect(socket.closeCalls).toBe(1);
    expect(socket.registry.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(120_000);
    expect(created).toHaveLength(1);
    expect(client.send({})).toBe(false);
  });

  it('an unclean drop DOES reconnect — the flag distinguishes the two', async () => {
    const { created, factory } = socketHarness();
    const client = createSocketClient('/ws', {
      socket: factory,
      retry: testRetryPolicy,
      random: fixedRandom,
    });

    lastOf(created).open();
    lastOf(created).drop();

    await vi.advanceTimersByTimeAsync(computeRetryDelay(testRetryPolicy, 1, 0, fixedRandom));
    expect(created).toHaveLength(2);

    client.close();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a close during a pending reconnect cancels the pending attempt', async () => {
    const { created, factory } = socketHarness();
    const client = createSocketClient('/ws', {
      socket: factory,
      retry: testRetryPolicy,
      random: fixedRandom,
    });

    lastOf(created).open();
    lastOf(created).drop();
    expect(vi.getTimerCount()).toBe(1);

    client.close();
    expect(vi.getTimerCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(120_000);
    expect(created).toHaveLength(1);
  });

  it('reports an unsupported answer instead of throwing when WebSocket is absent', () => {
    withoutGlobal('WebSocket', () => {
      const client = createSocketClient('/ws');
      expect(client.supported).toBe(false);
      expect(client.readyState).toBe(ConnectionState.Closed);
      expect(client.send({})).toBe(false);
      expect(() => client.close()).not.toThrow();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it('reports a decode failure without killing the connection', () => {
    const { created, factory } = socketHarness();
    const errors: Error[] = [];
    const received: unknown[] = [];
    const client = createSocketClient('/ws', {
      socket: factory,
      onError: (error) => errors.push(error),
      onMessage: (message) => received.push(message),
    });

    const socket = lastOf(created);
    socket.open();
    socket.deliver('not json');
    socket.deliver('{"ok":true}');

    expect(errors).toHaveLength(1);
    expect(received).toEqual([{ ok: true }]);
    expect(client.readyState).toBe(ConnectionState.Open);

    client.close();
  });
});

describe('createPoller — suspension', () => {
  it('skips ticks while the tab is hidden and refreshes when it returns', async () => {
    dom = installDom();
    const calls: number[] = [];
    const poller = createPoller(() => calls.push(1), { intervalMs: 1_000 });

    await vi.advanceTimersByTimeAsync(1_000);
    expect(calls).toHaveLength(1);

    dom.setHidden(true);
    expect(poller.state).toBe(PollerState.Paused);
    expect(vi.getTimerCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(5_000);
    expect(calls).toHaveLength(1);

    dom.setHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(poller.state).toBe(PollerState.Running);
    expect(calls).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(calls).toHaveLength(3);

    poller.stop();
  });

  it('skips ticks while offline and resumes on the online event', async () => {
    dom = installDom();
    const calls: number[] = [];
    const poller = createPoller(() => calls.push(1), { intervalMs: 1_000 });

    await vi.advanceTimersByTimeAsync(1_000);
    expect(calls).toHaveLength(1);

    dom.setOnline(false);
    expect(poller.state).toBe(PollerState.Paused);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toHaveLength(1);

    dom.setOnline(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(2);
    expect(poller.state).toBe(PollerState.Running);

    poller.stop();
  });

  it('starts suspended when created in a hidden tab', async () => {
    dom = installDom({ hidden: true });
    const calls: number[] = [];
    const poller = createPoller(() => calls.push(1), { intervalMs: 1_000 });

    expect(poller.state).toBe(PollerState.Paused);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toHaveLength(0);

    poller.stop();
  });

  it('becoming visible does NOT resume a manually paused poller', async () => {
    dom = installDom();
    const calls: number[] = [];
    const poller = createPoller(() => calls.push(1), { intervalMs: 1_000 });

    poller.pause();
    dom.setHidden(true);
    dom.setHidden(false);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toHaveLength(0);
    expect(poller.state).toBe(PollerState.Paused);

    poller.resume();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(1);

    poller.stop();
  });

  it('never overlaps ticks when the poll is slower than the interval', async () => {
    dom = installDom();
    let active = 0;
    let maxActive = 0;
    const poller = createPoller(
      async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 3_000));
        active -= 1;
      },
      { intervalMs: 1_000 },
    );

    await vi.advanceTimersByTimeAsync(20_000);
    expect(maxActive).toBe(1);

    poller.stop();
  });

  it('keeps polling after the poll throws', async () => {
    dom = installDom();
    const errors: Error[] = [];
    let calls = 0;
    const poller = createPoller(
      () => {
        calls += 1;
        throw new Error('boom');
      },
      { intervalMs: 1_000, onError: (error) => errors.push(error) },
    );

    await vi.advanceTimersByTimeAsync(3_000);
    expect(calls).toBe(3);
    expect(errors).toHaveLength(3);

    poller.stop();
  });
});

describe('createPoller — disposal', () => {
  it('stop clears the timer and removes every listener', async () => {
    dom = installDom();
    const calls: number[] = [];
    const poller = createPoller(() => calls.push(1), { intervalMs: 1_000 });

    expect(dom.windowListeners()).toBeGreaterThan(0);
    expect(dom.documentListeners()).toBeGreaterThan(0);

    poller.stop();

    expect(poller.state).toBe(PollerState.Stopped);
    expect(vi.getTimerCount()).toBe(0);
    expect(dom.windowListeners()).toBe(0);
    expect(dom.documentListeners()).toBe(0);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(calls).toHaveLength(0);
  });

  it('a tick in flight when stop lands does not re-arm the loop', async () => {
    dom = installDom();
    let calls = 0;
    const poller = createPoller(
      async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 500));
      },
      { intervalMs: 1_000 },
    );

    await vi.advanceTimersByTimeAsync(1_000);
    expect(calls).toBe(1);

    // Stop while the poll's own 500ms promise is still pending.
    poller.stop();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(calls).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('runs SSR-safe with no document or window at all', async () => {
    expect(typeof window).toBe('undefined');
    const calls: number[] = [];
    const poller = createPoller(() => calls.push(1), { intervalMs: 1_000 });

    await vi.advanceTimersByTimeAsync(1_000);
    expect(calls).toHaveLength(1);

    poller.stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('autoStart false waits for start', async () => {
    dom = installDom();
    const calls: number[] = [];
    const poller = createPoller(() => calls.push(1), { intervalMs: 1_000, autoStart: false });

    expect(poller.state).toBe(PollerState.Idle);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(calls).toHaveLength(0);

    poller.start();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(calls).toHaveLength(1);

    poller.stop();
  });
});

describe('waitForOnline', () => {
  it('resolves immediately when already online', async () => {
    dom = installDom({ online: true });
    await expect(waitForOnline({ timeoutMs: 1_000 })).resolves.toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(dom.windowListeners()).toBe(0);
  });

  it('resolves true on the online event, leaving nothing behind', async () => {
    dom = installDom({ online: false });
    expect(readOnlineStatus()).toBe(false);

    const pending = waitForOnline({ timeoutMs: 10_000 });
    expect(dom.windowListeners()).toBeGreaterThan(0);

    dom.setOnline(true);

    await expect(pending).resolves.toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(dom.windowListeners()).toBe(0);
  });

  it('resolves false when the timeout lapses, leaving nothing behind', async () => {
    dom = installDom({ online: false });

    const pending = waitForOnline({ timeoutMs: 5_000 });
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(pending).resolves.toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(dom.windowListeners()).toBe(0);
  });

  it('resolves false when the signal aborts', async () => {
    dom = installDom({ online: false });
    const controller = new AbortController();

    const pending = waitForOnline({ signal: controller.signal });
    controller.abort();

    await expect(pending).resolves.toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(dom.windowListeners()).toBe(0);
  });

  it('does not hang under SSR, where connectivity cannot be observed', async () => {
    expect(typeof window).toBe('undefined');
    await expect(waitForOnline({ timeoutMs: 1_000 })).resolves.toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reads offline only when navigator says so explicitly', () => {
    dom = installDom({ online: false });
    expect(readOnlineStatus()).toBe(false);
    dom.setOnline(true);
    expect(readOnlineStatus()).toBe(true);
  });
});
