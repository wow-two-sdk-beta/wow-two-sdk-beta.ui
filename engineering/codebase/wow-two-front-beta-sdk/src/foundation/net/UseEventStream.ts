// React binding for `createEventStream` — one stream per mount, closed on unmount.
//
// THE LIFETIME RULE THIS ENFORCES: an `EventSource` is a live HTTP connection that outlives the component
// that opened it. Nothing about unmounting a tree closes it, so a route change away from a page holding an
// un-closed stream leaves the connection open, the handlers subscribed, and the reconnect timer armed — and
// navigating back opens a SECOND one. Binding the stream to the effect makes the teardown automatic and makes
// double-mount (StrictMode) safe.
//
// HANDLERS LIVE IN A REF because an inline arrow is a new identity every render. In the effect's deps they
// would tear down and rebuild the stream on each render — dropping every event in the gap, re-running the
// server's connection handler, and resetting backoff. The ref keeps callbacks current while the stream stays
// put, so a handler closing over fresh props still sees them.
//
// OPTIONS ARE READ ONCE, when the stream opens. Changing `retry`, `events`, or `withCredentials` after mount
// does NOT rebuild the stream; only `url` does. Options are configuration, not state — a consumer that must
// genuinely swap them at runtime should remount with a `key`. This mirrors `useSyncChannel` in
// `foundation/sync`.
//
// A `null` URL MEANS "NOT YET", not "broken" — the shape every real app needs while it waits for a token or a
// route param. No stream is opened, and the state reads `closed`.

import { useCallback, useEffect, useRef, useState } from 'react';

import { ConnectionState } from './ConnectionState';
import { createEventStream, type EventStream, type EventStreamOptions, type EventStreamPayloads } from './CreateEventStream';

/** The live view a component gets over its stream. */
export interface EventStreamHandle {
  /** The current connection state, re-rendering the component on every transition. */
  readonly readyState: ConnectionState;

  /** Whether `EventSource` exists in this runtime; `false` under SSR and in a locked-down browser. */
  readonly supported: boolean;

  /** Closes the stream early. Stable across renders; the unmount cleanup calls it anyway. */
  readonly close: () => void;
}

/**
 * Opens a Server-Sent Events stream for the lifetime of the component.
 *
 * The stream is closed on unmount and re-opened whenever `url` changes. Pass `null` to hold off connecting
 * (waiting for auth, a route param, a feature flag).
 *
 * @typeParam TEvents - Maps each server event name to its payload type.
 * @param url - The stream endpoint, or `null` to stay disconnected.
 * @param options - Handlers and configuration, read once when the stream opens.
 * @returns The connection state, support flag, and a stable `close`.
 */
export function useEventStream<TEvents extends EventStreamPayloads = EventStreamPayloads>(
  url: string | null,
  options: EventStreamOptions<TEvents> = {},
): EventStreamHandle {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const streamRef = useRef<EventStream | null>(null);
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
    const stream = createEventStream<TEvents>(url, {
      ...current,
      // Every consumer callback is re-read from the ref at call time, which is what lets the effect depend on
      // `url` alone. `onStateChange` is additionally intercepted to drive the component's own state.
      onStateChange: (state) => {
        setReadyState(state);
        optionsRef.current.onStateChange?.(state);
      },
      onOpen: () => optionsRef.current.onOpen?.(),
      onError: (error, context) => optionsRef.current.onError?.(error, context),
      onMessage: (data, event) => optionsRef.current.onMessage?.(data, event),
    });

    streamRef.current = stream;
    setSupported(stream.supported);
    setReadyState(stream.readyState);

    return () => {
      stream.close();
      streamRef.current = null;
    };
  }, [url]);

  const close = useCallback(() => {
    streamRef.current?.close();
  }, []);

  return { readyState, supported, close };
}
