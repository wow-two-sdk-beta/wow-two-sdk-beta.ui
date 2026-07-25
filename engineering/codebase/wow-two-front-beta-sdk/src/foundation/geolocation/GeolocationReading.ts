// The render-facing state shape of the vector, plus the pure reducer that folds a `PositionResult` into it.
//
// Kept OUT of the hook files, and free of React, for two reasons: both hooks need exactly the same fold (a
// one-shot request and a watch emission update state identically), and the interesting decisions below are then
// testable without a renderer.
//
// TWO STATUSES THE PLATFORM DOES NOT HAVE. `idle` (never asked) and `locating` (asked, waiting) are states a UI
// must render — an empty frame vs. a spinner — and neither is a `PositionResult`. Extending the result union
// rather than adding a parallel `loading` boolean keeps the whole lifecycle in ONE switch, so no consumer can
// render a "no location" empty state while a request is still in flight.
//
// A LATER FAILURE DOES NOT ERASE THE LAST FIX. `position` holds the most recent successful reading and survives
// a subsequent `denied` / `timeout` / `unavailable`. A map that drops its pin the moment a watch misses one
// update is worse than one showing a slightly stale position with a "signal lost" note — and the consumer can
// always ignore `position` when `status !== 'ok'` if it wants the strict reading. `error` does the opposite: it
// is cleared on every non-`failed` outcome, so a stale message can never outlive the failure it described.

import type { Position } from './Coordinates';
import type { PositionResult, PositionStatus } from './PositionResult';

/**
 * Where a geolocation consumer sits in its lifecycle: the platform's outcomes, plus the two states that exist
 * only in the UI — `idle` (nothing requested yet) and `locating` (a request is in flight).
 */
export type GeolocationState = 'idle' | 'locating' | PositionStatus;

/** The state both {@link useGeolocation} and {@link useWatchPosition} expose. */
export interface GeolocationReading {
  /** The lifecycle state — drive the whole UI off this one switch. */
  readonly status: GeolocationState;

  /**
   * The most recent successful fix, or `null` before the first one. Deliberately NOT cleared by a later
   * failure — check `status === 'ok'` when only a currently-valid reading will do.
   */
  readonly position: Position | null;

  /** The error behind a `failed` status, or `null` for every other status. Never stale. */
  readonly error: Error | null;
}

/** The starting state: nothing requested, nothing known. */
export const IdleGeolocationReading: GeolocationReading = {
  status: 'idle',
  position: null,
  error: null,
};

/**
 * Folds one {@link PositionResult} into the current reading. Pure; exported for the two hooks and for tests,
 * absent from the barrel.
 *
 * @param previous The reading being updated — its `position` is what carries a past fix forward.
 * @param result The outcome to apply.
 * @returns The next reading.
 */
export function applyPositionResult(previous: GeolocationReading, result: PositionResult): GeolocationReading {
  return {
    status: result.status,
    position: result.status === 'ok' ? result.position : previous.position,
    error: result.status === 'failed' ? result.error : null,
  };
}
