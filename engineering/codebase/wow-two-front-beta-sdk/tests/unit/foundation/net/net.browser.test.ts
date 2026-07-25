import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ConnectionState,
  PollerState,
  SocketReadyState,
  useEventStream,
  usePolling,
  useSocket,
  type EventStreamSource,
  type EventStreamSourceFactory,
  type SocketConnection,
  type SocketFactory,
} from '@src/foundation/net';

// Browser project — real chromium, so React really mounts, effects really run, and unmount cleanup really
// fires. That is the whole point: the leak these hooks exist to prevent (a stream, socket, or interval that
// outlives its component) cannot be observed in a node test with no renderer.
//
// The TRANSPORTS are still doubles. A real `EventSource` or `WebSocket` here would need a live server, would
// make the suite depend on the network, and — worse — would hide the assertion that matters, since a socket
// that leaks looks exactly like one that does not until something times out. The doubles count their own
// `close()` calls and their own listeners, so "closed on unmount" becomes an exact assertion rather than an
// absence of symptoms.
//
// The POLLER is asserted on real timers with a short interval, not fake ones. Its unmount contract is
// "no further ticks ever", and the honest way to check that is to let real time pass after unmounting and
// see the counter stay put. Its listener teardown is asserted through spies on the real `document`.

/** Tracks listeners by type so a test can assert every one was removed. */
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

  /** Dispatches to every listener of a type. */
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

/** Reads the last element of an array without a non-null assertion (`noUncheckedIndexedAccess`). */
function lastOf<T>(items: readonly T[]): T {
  const item = items.at(-1);
  if (item === undefined) throw new Error('Expected at least one recorded item.');
  return item;
}

/** A minimal `EventSource` double that counts its own disposal. */
class FakeEventSource implements EventStreamSource {
  readyState = 0;
  closeCalls = 0;
  readonly registry = new ListenerRegistry();

  constructor(readonly url: string) {}

  addEventListener(type: string, listener: (event: Event) => void): void {
    this.registry.add(type, listener);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.registry.remove(type, listener);
  }

  close(): void {
    this.closeCalls += 1;
    this.readyState = 2;
  }

  /** Simulates a successful connection. */
  open(): void {
    this.readyState = 1;
    this.registry.emit('open');
  }
}

/** Records every stream the hook builds. */
function eventSourceHarness(): { created: FakeEventSource[]; factory: EventStreamSourceFactory } {
  const created: FakeEventSource[] = [];
  return {
    created,
    factory: (url) => {
      const source = new FakeEventSource(url);
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

  constructor(readonly url: string) {}

  addEventListener(type: string, listener: (event: Event) => void): void {
    this.registry.add(type, listener);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.registry.remove(type, listener);
  }

  send(data: string): void {
    if (this.readyState !== SocketReadyState.Open) throw new Error('InvalidStateError: still CONNECTING');
    this.sent.push(data);
  }

  close(): void {
    this.closeCalls += 1;
    if (this.readyState === SocketReadyState.Closed) return;
    this.readyState = SocketReadyState.Closed;
    this.registry.emit('close', { wasClean: true, code: 1000 });
  }

  /** Completes the handshake. */
  open(): void {
    this.readyState = SocketReadyState.Open;
    this.registry.emit('open');
  }

  /** Delivers an inbound text frame. */
  deliver(data: string): void {
    this.registry.emit('message', { data });
  }
}

/** Records every socket the hook builds. */
function socketHarness(): { created: FakeSocket[]; factory: SocketFactory } {
  const created: FakeSocket[] = [];
  return {
    created,
    factory: (url) => {
      const socket = new FakeSocket(url);
      created.push(socket);
      return socket;
    },
  };
}

afterEach(cleanup);

describe('useEventStream', () => {
  it('closes the stream on unmount', () => {
    const { created, factory } = eventSourceHarness();
    const { unmount } = renderHook(() => useEventStream('/sse', { eventSource: factory }));

    const source = lastOf(created);
    act(() => source.open());
    expect(source.registry.size).toBeGreaterThan(0);

    unmount();

    expect(source.closeCalls).toBe(1);
    expect(source.registry.size).toBe(0);
  });

  it('tracks the connection state through to the component', () => {
    const { created, factory } = eventSourceHarness();
    const { result, unmount } = renderHook(() => useEventStream('/sse', { eventSource: factory }));

    expect(result.current.readyState).toBe(ConnectionState.Connecting);
    expect(result.current.supported).toBe(true);

    act(() => lastOf(created).open());
    expect(result.current.readyState).toBe(ConnectionState.Open);

    unmount();
  });

  it('opens nothing while the url is null', () => {
    const { created, factory } = eventSourceHarness();
    const { result, unmount } = renderHook(() => useEventStream(null, { eventSource: factory }));

    expect(created).toHaveLength(0);
    expect(result.current.readyState).toBe(ConnectionState.Closed);

    unmount();
  });

  it('closes the old stream when the url changes', () => {
    const { created, factory } = eventSourceHarness();
    const { rerender, unmount } = renderHook(({ url }: { url: string }) => useEventStream(url, { eventSource: factory }), {
      initialProps: { url: '/sse/a' },
    });

    const first = lastOf(created);
    rerender({ url: '/sse/b' });

    expect(first.closeCalls).toBe(1);
    expect(first.registry.size).toBe(0);
    expect(created).toHaveLength(2);
    expect(lastOf(created).url).toBe('/sse/b');

    unmount();
  });

  it('delivers messages to a handler that changed identity since mount', () => {
    const { created, factory } = eventSourceHarness();
    const received: unknown[] = [];
    const { rerender, unmount } = renderHook(
      ({ tag }: { tag: string }) =>
        useEventStream('/sse', {
          eventSource: factory,
          // A new closure every render — the ref indirection is what keeps this current without rebuilding.
          onMessage: (data) => received.push({ tag, data }),
        }),
      { initialProps: { tag: 'first' } },
    );

    rerender({ tag: 'second' });
    expect(created).toHaveLength(1);

    act(() => lastOf(created).registry.emit('message', { data: '{"n":1}' }));
    expect(received).toEqual([{ tag: 'second', data: { n: 1 } }]);

    unmount();
  });
});

describe('useSocket', () => {
  it('closes the socket on unmount', () => {
    const { created, factory } = socketHarness();
    const { unmount } = renderHook(() => useSocket('/ws', { socket: factory }));

    const socket = lastOf(created);
    act(() => socket.open());
    expect(socket.registry.size).toBeGreaterThan(0);

    unmount();

    expect(socket.closeCalls).toBe(1);
    expect(socket.registry.size).toBe(0);
  });

  it('queues a send issued before the socket opens', () => {
    const { created, factory } = socketHarness();
    const { result, unmount } = renderHook(() => useSocket<unknown, { n: number }>('/ws', { socket: factory }));

    const socket = lastOf(created);
    expect(result.current.send({ n: 1 })).toBe(false);
    expect(socket.sent).toEqual([]);

    act(() => socket.open());

    expect(socket.sent).toEqual(['{"n":1}']);
    expect(result.current.readyState).toBe(ConnectionState.Open);
    expect(result.current.send({ n: 2 })).toBe(true);

    unmount();
  });

  it('keeps send and close stable across renders', () => {
    const { factory } = socketHarness();
    const { result, rerender, unmount } = renderHook(() => useSocket('/ws', { socket: factory }));

    const first = { send: result.current.send, close: result.current.close };
    rerender();

    expect(result.current.send).toBe(first.send);
    expect(result.current.close).toBe(first.close);

    unmount();
  });

  it('send after unmount is a no-op, not a crash', () => {
    const { created, factory } = socketHarness();
    const { result, unmount } = renderHook(() => useSocket('/ws', { socket: factory }));

    act(() => lastOf(created).open());
    const { send } = result.current;
    unmount();

    expect(() => send({ late: true })).not.toThrow();
    expect(send({ late: true })).toBe(false);
  });

  it('opens nothing while the url is null', () => {
    const { created, factory } = socketHarness();
    const { result, unmount } = renderHook(() => useSocket(null, { socket: factory }));

    expect(created).toHaveLength(0);
    expect(result.current.readyState).toBe(ConnectionState.Closed);

    unmount();
  });
});

describe('usePolling', () => {
  it('stops the loop on unmount — no tick ever fires again', async () => {
    let calls = 0;
    const { unmount } = renderHook(() => usePolling(() => (calls += 1), { intervalMs: 10, immediate: true }));

    await waitFor(() => expect(calls).toBeGreaterThan(1));

    unmount();
    const observed = calls;
    // Real time, deliberately: the contract is "never again", and only real elapsed time proves it.
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(calls).toBe(observed);
  });

  it('detaches its visibility and connectivity listeners on unmount', () => {
    const documentAdd = vi.spyOn(document, 'addEventListener');
    const documentRemove = vi.spyOn(document, 'removeEventListener');
    const windowAdd = vi.spyOn(window, 'addEventListener');
    const windowRemove = vi.spyOn(window, 'removeEventListener');

    try {
      const { unmount } = renderHook(() => usePolling(() => undefined, { intervalMs: 10_000 }));

      const added = documentAdd.mock.calls.filter(([type]) => type === 'visibilitychange').length;
      const onlineAdded = windowAdd.mock.calls.filter(([type]) => type === 'online' || type === 'offline').length;
      expect(added).toBe(1);
      expect(onlineAdded).toBe(2);

      unmount();

      expect(documentRemove.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(1);
      expect(windowRemove.mock.calls.filter(([type]) => type === 'online' || type === 'offline')).toHaveLength(2);
    } finally {
      documentAdd.mockRestore();
      documentRemove.mockRestore();
      windowAdd.mockRestore();
      windowRemove.mockRestore();
    }
  });

  it('pauses and resumes through the returned controls', async () => {
    let calls = 0;
    const { result, unmount } = renderHook(() => usePolling(() => (calls += 1), { intervalMs: 10 }));

    await waitFor(() => expect(calls).toBeGreaterThan(0));

    act(() => result.current.pause());
    expect(result.current.state).toBe(PollerState.Paused);

    const paused = calls;
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(calls).toBe(paused);

    act(() => result.current.resume());
    expect(result.current.state).toBe(PollerState.Running);
    await waitFor(() => expect(calls).toBeGreaterThan(paused));

    unmount();
  });

  it('calls the latest fn, not the one captured at mount', async () => {
    const seen: string[] = [];
    const { rerender, unmount } = renderHook(
      ({ tag }: { tag: string }) => usePolling(() => seen.push(tag), { intervalMs: 10 }),
      { initialProps: { tag: 'first' } },
    );

    rerender({ tag: 'second' });
    await waitFor(() => expect(seen.length).toBeGreaterThan(0));

    expect(seen.every((tag) => tag === 'second')).toBe(true);

    unmount();
  });

  it('keeps pause, resume, and stop stable across renders', () => {
    const { result, rerender, unmount } = renderHook(() => usePolling(() => undefined, { intervalMs: 10_000 }));

    const first = { pause: result.current.pause, resume: result.current.resume, stop: result.current.stop };
    rerender();

    expect(result.current.pause).toBe(first.pause);
    expect(result.current.resume).toBe(first.resume);
    expect(result.current.stop).toBe(first.stop);

    unmount();
  });
});
