// React binding for `createSocketClient` — one socket per mount, closed on unmount.
//
// THE LIFETIME RULE THIS ENFORCES: a `WebSocket` abandoned by its component stays connected, keeps its
// heartbeat interval running, and keeps reconnecting on backoff — forever, since nothing else holds a
// reference with which to close it. In an SPA that is one leaked socket per visit to the page, and the server
// sees the connection count climb with no matching users. Binding the client to the effect makes the teardown
// automatic and makes double-mount (StrictMode) safe.
//
// THE RETURNED `send` IS STABLE AND ALWAYS SAFE TO CALL. It reads the current client through a ref, so it
// never goes stale in a memoized child, and it works BEFORE the socket finishes connecting — the client's
// queue is what makes that true (see `CreateSocketClient.ts`, bug 1). Calling it after unmount is a no-op
// rather than a crash, which matters because an in-flight event handler routinely outlives the tree.
//
// HANDLERS LIVE IN A REF, options are read once, and a `null` URL means "not yet" — same three rules as
// `useEventStream`, for the same reasons.

import { useCallback, useEffect, useRef, useState } from 'react';

import { ConnectionState } from './ConnectionState';
import { createSocketClient, type SocketClient, type SocketClientOptions } from './CreateSocketClient';

/** The live view a component gets over its socket. */
export interface SocketHandle<TOut> {
  /** The current connection state, re-rendering the component on every transition. */
  readonly readyState: ConnectionState;

  /** Whether `WebSocket` exists in this runtime; `false` under SSR. */
  readonly supported: boolean;

  /**
   * Sends a message, queueing it while the socket is still connecting. Stable across renders.
   *
   * @returns `true` when the frame went out immediately, `false` when queued, dropped, or unmounted.
   */
  readonly send: (message: TOut) => boolean;

  /** Closes the socket early and suppresses reconnection. Stable across renders; the unmount cleanup calls it anyway. */
  readonly close: () => void;
}

/**
 * Opens a JSON WebSocket for the lifetime of the component.
 *
 * The socket is closed on unmount and re-opened whenever `url` changes. Pass `null` to hold off connecting
 * (waiting for auth, a route param, a feature flag).
 *
 * @typeParam TIn - The decoded inbound message type.
 * @typeParam TOut - The outbound message type.
 * @param url - The socket endpoint, or `null` to stay disconnected.
 * @param options - Handlers and configuration, read once when the socket opens.
 * @returns The connection state, support flag, and stable `send` / `close`.
 */
export function useSocket<TIn = unknown, TOut = unknown>(
  url: string | null,
  options: SocketClientOptions<TIn, TOut> = {},
): SocketHandle<TOut> {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const clientRef = useRef<SocketClient<TOut> | null>(null);
  const [readyState, setReadyState] = useState<ConnectionState>(
    url === null ? ConnectionState.Closed : ConnectionState.Connecting,
  );
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (url === null) {
      setReadyState(ConnectionState.Closed);
      return;
    }

    const current = optionsRef.current;
    const client = createSocketClient<TIn, TOut>(url, {
      ...current,
      // Every consumer callback is re-read from the ref at call time, which is what lets the effect depend on
      // `url` alone. `onStateChange` is additionally intercepted to drive the component's own state.
      onStateChange: (state) => {
        setReadyState(state);
        optionsRef.current.onStateChange?.(state);
      },
      onOpen: () => optionsRef.current.onOpen?.(),
      onClose: (event) => optionsRef.current.onClose?.(event),
      onError: (error) => optionsRef.current.onError?.(error),
      onMessage: (message, event) => optionsRef.current.onMessage?.(message, event),
    });

    clientRef.current = client;
    setSupported(client.supported);
    setReadyState(client.readyState);

    return () => {
      client.close();
      clientRef.current = null;
    };
  }, [url]);

  const send = useCallback((message: TOut) => clientRef.current?.send(message) ?? false, []);

  const close = useCallback(() => {
    clientRef.current?.close();
  }, []);

  return { readyState, supported, send, close };
}
