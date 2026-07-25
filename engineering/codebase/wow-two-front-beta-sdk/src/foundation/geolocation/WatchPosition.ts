// The streaming read: a continuous subscription to the device's position, handed back as a disposer.
//
// A FORGOTTEN WATCH IS A BATTERY BUG, and the worst kind — invisible in every metric a web app has. `watchId`
// registrations are owned by the browser, not by the page's component tree: they outlive the component that
// started them, they are not garbage-collected when the last reference to the handler is dropped, and a
// high-accuracy watch holds the GPS radio ACTIVE for as long as it lives. A single watch started in an effect
// with no cleanup keeps draining after the user has navigated away from the screen that wanted it, and a
// remount starts a second one on top. Hence the shape: this returns a disposer, not an id — there is no way to
// call it and be handed something you can forget to clean up without noticing you were handed it.
//
// The disposer is IDEMPOTENT. Browsers recycle watch ids, so a second `clearWatch(id)` after the id has been
// reissued would cancel an unrelated watch belonging to some other part of the app. The `disposed` flag makes
// double-dispose (a React 19 StrictMode remount, a defensive `finally`) a no-op instead of sabotage.
//
// EMISSIONS AFTER DISPOSE ARE DROPPED. `clearWatch` stops future acquisitions but does not un-queue a callback
// the platform has already scheduled, so a late fix can arrive after the consumer has torn down. The same flag
// gates the handler.
//
// Every emission is the same `PositionResult` union `getCurrentPosition` resolves to — including `unsupported`,
// emitted once and synchronously where there is no API, so a subscriber always hears exactly one answer rather
// than waiting forever for a fix that cannot come. A throwing handler is swallowed: a consumer's broken render
// must not kill the subscription or throw inside a platform callback.

import { toError } from '../errors';

import { geolocationApi } from './CanLocate';
import { toPositionResult, toPositionSuccess, type PositionRequestOptions, type PositionResult } from './PositionResult';

/** Receives every emission of a watch — a new fix, or a failure. Called with the same union as a one-shot read. */
export type PositionHandler = (result: PositionResult) => void;

/**
 * Subscribes to the device's position and calls `handler` on every fix and every failure.
 *
 * Unlike {@link getCurrentPosition}, a watch does not end: it keeps reporting until disposed, which is why the
 * return value is the disposer. **Always call it** — in a React effect's cleanup, on route change, when the
 * feature is toggled off. A live watch holds the location hardware on.
 *
 * Emits `unsupported` once, synchronously, where there is no Geolocation API, then never again.
 *
 * Never throws — neither this call nor any emission.
 *
 * @param handler Called with each {@link PositionResult}. A throw from it is swallowed.
 * @param options Accuracy / timeout / cache-age tuning. See {@link PositionRequestOptions}.
 * @returns The disposer. Idempotent; safe to call more than once and after emissions have stopped.
 */
export function watchPosition(handler: PositionHandler, options?: PositionRequestOptions): () => void {
  let disposed = false;
  let watchId: number | undefined;

  /** Hands the subscriber a result, absorbing a throw from their own handler and ignoring post-dispose noise. */
  const emit = (result: PositionResult): void => {
    if (disposed) return;
    try {
      handler(result);
    } catch {
      // The subscriber's handler failed. Their problem, and not a reason to break the subscription or to let an
      // exception escape into a platform callback, where nothing can catch it.
    }
  };

  const api = geolocationApi();
  if (api === undefined || typeof api.watchPosition !== 'function') {
    emit({ status: 'unsupported' });
    return () => {
      disposed = true;
    };
  }

  try {
    const id: unknown = api.watchPosition(
      (raw) => emit(toPositionSuccess(raw)),
      (error) => emit(toPositionResult(error)),
      options,
    );
    // A spec-conformant implementation returns a number. Anything else is kept out of `watchId` so the disposer
    // never hands `clearWatch` a value it cannot act on.
    if (typeof id === 'number') watchId = id;
  } catch (error) {
    emit({ status: 'failed', error: toError(error) });
  }

  return () => {
    if (disposed) return;
    disposed = true;

    if (watchId === undefined) return;
    const id = watchId;
    // Cleared before the call, so a throwing `clearWatch` cannot leave the disposer able to fire it twice.
    watchId = undefined;

    try {
      if (typeof api.clearWatch === 'function') api.clearWatch(id);
    } catch {
      // A stand-in without a working `clearWatch`. Nothing further to do — the flag already stopped emissions.
    }
  };
}
