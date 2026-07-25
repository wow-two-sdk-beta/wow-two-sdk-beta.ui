// The React binding of the watch — position tracking bound to a component's lifetime.
//
// THE CLEANUP IS THE WHOLE POINT. `watchPosition` returns a disposer precisely because a watch outlives the
// code that started it, and this hook exists so that "as long as this component is mounted" is the lifetime a
// consumer gets for free. The effect returns the disposer directly, so React clears the watch on unmount, on
// every dependency change, and on a React 19 StrictMode remount. A watch that survived unmount would keep the
// GPS radio active for the rest of the session with nothing on screen referencing it — a battery drain no
// page-level metric would ever attribute to this component.
//
// TRACKING STARTS ON MOUNT, unlike `useGeolocation`, which requests nothing until asked. That is the trade a
// consumer makes by choosing this hook: mounting it may raise the permission prompt, so mount it on the screen
// that actually shows a live position — behind the toggle, not above it.
//
// DEPENDENCIES ARE THE THREE OPTION VALUES, NOT THE OPTIONS OBJECT. Depending on the object itself would
// restart the watch on every render for the overwhelmingly common `useWatchPosition({ timeout: 5000 })` call
// site — a fresh literal each render, a new watch each render. Depending on the primitives restarts only when a
// value genuinely changed, which is the intended behaviour: a changed accuracy or timeout budget requires a new
// watch, since the platform has no way to retune a live one.

import { useEffect, useState } from 'react';

import { applyPositionResult, IdleGeolocationReading, type GeolocationReading } from './GeolocationReading';
import type { PositionRequestOptions } from './PositionResult';
import { watchPosition } from './WatchPosition';

/**
 * Tracks the device's position for as long as the component is mounted, clearing the watch on unmount.
 *
 * Starts on mount — see the header. Every fix and every failure arrives through the same
 * {@link GeolocationReading} shape `useGeolocation` exposes, minus the manual `request`; the last successful
 * fix survives a later failure, so a map keeps its pin when the signal drops.
 *
 * Inherits the slice's never-throws contract.
 *
 * @param options Accuracy / timeout / cache-age tuning. Changing any of the three values restarts the watch.
 */
export function useWatchPosition(options?: PositionRequestOptions): GeolocationReading {
  const [reading, setReading] = useState<GeolocationReading>(IdleGeolocationReading);

  const enableHighAccuracy = options?.enableHighAccuracy;
  const timeout = options?.timeout;
  const maximumAge = options?.maximumAge;

  useEffect(() => {
    setReading((previous) => ({ ...previous, status: 'locating' }));

    // Returned straight to React: the disposer IS the cleanup, so there is no path on which the watch outlives
    // the component.
    return watchPosition((result) => setReading((previous) => applyPositionResult(previous, result)), {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  return reading;
}
