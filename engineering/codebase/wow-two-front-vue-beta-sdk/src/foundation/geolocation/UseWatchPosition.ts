// The Vue binding of the watch — position tracking bound to a scope's lifetime.
//
// THE CLEANUP IS THE WHOLE POINT. `watchPosition` returns a disposer precisely because a watch outlives the
// code that started it, and this composable exists so that "as long as this component is mounted" is the
// lifetime a consumer gets for free. The disposer is called from `onScopeDispose` and again before every
// restart, so the watch is cleared on unmount and on every option change. A watch that survived unmount would
// keep the GPS radio active for the rest of the session with nothing on screen referencing it — a battery
// drain no page-level metric would ever attribute to this component.
//
// TRACKING STARTS ON MOUNT, unlike `useGeolocation`, which requests nothing until asked. That is the trade a
// consumer makes by choosing this composable: mounting it may raise the permission prompt, so mount it on the
// screen that actually shows a live position — behind the toggle, not above it.
//
// STARTED FROM `onMounted`, NEVER FROM AN IMMEDIATE WATCHER. `watchPosition` reads `navigator.geolocation`, and
// an immediate watcher also runs during a server render, where that global does not exist. `onMounted` is
// client-only by construction, so the SSR pass yields the idle reading and the watch begins at hydration.
//
// THE WATCHED SOURCE IS THE THREE OPTION VALUES, NOT THE OPTIONS OBJECT. Watching the object itself would
// restart the watch on every change of identity for the overwhelmingly common `useWatchPosition({ timeout:
// 5000 })` call site. Watching the primitives restarts only when a value genuinely changed, which is the
// intended behaviour: a changed accuracy or timeout budget requires a new watch, since the platform has no way
// to retune a live one.

import { onMounted, onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from 'vue';

import { applyPositionResult, IdleGeolocationReading, type GeolocationReading } from './GeolocationReading';
import type { PositionRequestOptions } from './PositionResult';
import { watchPosition } from './WatchPosition';

/**
 * Tracks the device's position for as long as the scope lives, clearing the watch when it is disposed.
 *
 * Starts on mount — see the header. Every fix and every failure arrives through the same
 * {@link GeolocationReading} shape `useGeolocation` exposes, minus the manual `request`; the last successful
 * fix survives a later failure, so a map keeps its pin when the signal drops.
 *
 * Inherits the slice's never-throws contract.
 *
 * @param options Accuracy / timeout / cache-age tuning. Changing any of the three values restarts the watch.
 * @returns The current reading. Holds {@link IdleGeolocationReading} during SSR and until mount.
 */
export function useWatchPosition(
  options?: MaybeRefOrGetter<PositionRequestOptions | undefined>,
): Readonly<ShallowRef<GeolocationReading>> {
  const reading: ShallowRef<GeolocationReading> = shallowRef(IdleGeolocationReading);

  let dispose: (() => void) | undefined;

  function stop(): void {
    dispose?.();
    dispose = undefined;
  }

  function start(): void {
    stop();
    reading.value = { ...reading.value, status: 'locating' };

    const resolved = toValue(options);
    dispose = watchPosition(
      (result) => {
        reading.value = applyPositionResult(reading.value, result);
      },
      {
        enableHighAccuracy: resolved?.enableHighAccuracy,
        timeout: resolved?.timeout,
        maximumAge: resolved?.maximumAge,
      },
    );
  }

  onMounted(start);
  // Non-immediate on purpose: an immediate watcher runs on the server, where `navigator` is absent. Three
  // separate getters rather than one returning a tuple — Vue compares each source with `Object.is`, so an
  // options object of a fresh identity carrying the same three values does not restart the watch.
  watch(
    [() => toValue(options)?.enableHighAccuracy, () => toValue(options)?.timeout, () => toValue(options)?.maximumAge],
    start,
  );
  onScopeDispose(stop);

  return reading;
}
