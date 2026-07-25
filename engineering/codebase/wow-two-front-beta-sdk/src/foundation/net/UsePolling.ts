// React binding for `createPoller` — one loop per mount, stopped on unmount.
//
// THE LIFETIME RULE THIS ENFORCES: a poller holds a timer plus a `visibilitychange` and two connectivity
// listeners. An unmounted component that never stopped its poller keeps all four, keeps issuing requests, and
// keeps writing into state that no longer renders — the "Can't perform a React state update on an unmounted
// component" class of bug, except it also costs a request every interval, forever.
//
// `fn` LIVES IN A REF, which is more than an optimization here. An inline `async () => setRows(await
// api.get(...))` is a new identity on every render, and every one of those renders is caused by the previous
// poll's own `setState`. In the effect's deps that is an infinite restart loop that also resets the interval
// each time, so the poll rate silently becomes "as fast as React can re-render". The ref breaks the cycle:
// the loop is built once, and each tick calls whatever `fn` is current.
//
// The suspend rules (hidden tab, offline) belong to the poller itself, not to this hook, so a non-React
// caller gets identical behaviour — see `CreatePoller.ts`. In particular this hook does NOT call
// `useOnlineStatus`: doing so would re-render the component on every connectivity flip merely to tell the
// poller something it already knows from the same events.

import { useCallback, useEffect, useRef, useState } from 'react';

import { PollerState, createPoller, type PollFn, type Poller, type PollerOptions } from './CreatePoller';

/** The live view a component gets over its poll loop. */
export interface PollingHandle {
  /** The current poller state, re-rendering the component on every transition. `paused` covers manual, hidden, and offline. */
  readonly state: PollerState;

  /** Suspends polling until `resume()`. Stable across renders. */
  readonly pause: () => void;

  /** Clears the manual suspension; polling stays suspended if the tab is hidden or the browser offline. Stable across renders. */
  readonly resume: () => void;

  /** Stops the loop and detaches its listeners. Stable across renders; the unmount cleanup calls it anyway. */
  readonly stop: () => void;
}

/**
 * Runs `fn` on an interval for the lifetime of the component, suspended automatically while the tab is
 * hidden or the browser is offline.
 *
 * The loop stops on unmount and is rebuilt whenever `intervalMs` changes. `fn` may change identity freely
 * between renders — it is read fresh on each tick.
 *
 * @param fn - The work to repeat; a returned promise is awaited before the next tick is scheduled.
 * @param options - Interval and suspension behaviour, read once when the loop is built.
 * @returns The poller state and stable `pause` / `resume` / `stop`.
 */
export function usePolling(fn: PollFn, options: PollerOptions = {}): PollingHandle {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const pollerRef = useRef<Poller | null>(null);
  const [state, setState] = useState<PollerState>(PollerState.Idle);

  const { intervalMs } = options;

  useEffect(() => {
    const current = optionsRef.current;
    const poller = createPoller(() => fnRef.current(), {
      ...current,
      intervalMs,
      onStateChange: (next) => {
        setState(next);
        optionsRef.current.onStateChange?.(next);
      },
      onError: (error) => optionsRef.current.onError?.(error),
    });

    pollerRef.current = poller;
    setState(poller.state);

    return () => {
      poller.stop();
      pollerRef.current = null;
    };
  }, [intervalMs]);

  const pause = useCallback(() => {
    pollerRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    pollerRef.current?.resume();
  }, []);

  const stop = useCallback(() => {
    pollerRef.current?.stop();
  }, []);

  return { state, pause, resume, stop };
}
