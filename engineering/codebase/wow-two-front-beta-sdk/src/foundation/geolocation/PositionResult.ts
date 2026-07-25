// The shared vocabulary of a position request: what goes in (options), what comes back (a discriminated
// result), and the translation of the platform's error object into it. Both entry points — the one-shot
// `getCurrentPosition` and the streaming `watchPosition` — speak exactly this, so a consumer writes ONE switch
// and reuses it for both.
//
// THE CODE MAPPING IS THE POINT OF THIS MODULE. `GeolocationPositionError` reports failure as a bare integer,
// and the three values mean things a UI must treat completely differently:
//   1 PERMISSION_DENIED    → the user (or a `Permissions-Policy` header) said no. Asking again does nothing
//                            until they change it in browser settings — so the UI must stop asking and explain.
//   2 POSITION_UNAVAILABLE → the request was allowed but no fix came back: indoors, no GPS, radio off. This one
//                            IS worth retrying, and is the single most common failure in the wild.
//   3 TIMEOUT              → allowed, still trying, ran out of `timeout` ms. Retryable, and a hint that the
//                            budget was too tight for a cold GPS fix.
// Collapsing them into one "location error" is what the module exists to prevent: it produces UIs that tell a
// user in a basement to check their browser permissions.
//
// The codes are compared as NUMERIC LITERALS, not as `GeolocationPositionError.PERMISSION_DENIED`. The named
// constants live on the platform's own constructor, which does not exist under SSR and does not exist on the
// plain `{ code: 1 }` object a test double or a Cordova-era polyfill throws. The integers are frozen by the W3C
// spec and are the only part of the error that is reliably there.
//
// A code outside 1–3 (including a missing or unreadable one) is NOT silently bucketed into `unavailable`: it
// becomes `failed` carrying a normalized `Error`, so a future spec addition or a broken polyfill surfaces as
// something a consumer can log rather than as a plausible-looking lie.

import { toError } from '../errors';

import { toPosition, type Position } from './Coordinates';

/** `GeolocationPositionError.PERMISSION_DENIED` — the user or a policy refused. */
const PermissionDeniedCode = 1;

/** `GeolocationPositionError.POSITION_UNAVAILABLE` — allowed, but no fix could be acquired. */
const PositionUnavailableCode = 2;

/** `GeolocationPositionError.TIMEOUT` — allowed, but the fix did not arrive inside the timeout budget. */
const TimeoutCode = 3;

/** The message on the `Error` reported when the platform hands back a position nothing can be read out of. */
export const UnreadablePositionMessage = 'Geolocation reported a position with no readable coordinates.';

/**
 * The outcome of a position request — one-shot or one emission of a watch.
 *
 * - `ok` — a fix, as a plain {@link Position} snapshot.
 * - `denied` — code 1. Permanent for this origin until the user changes it; do not re-prompt.
 * - `unavailable` — code 2. Transient; retry is reasonable.
 * - `timeout` — code 3. Transient; retry, possibly with a larger `timeout`.
 * - `unsupported` — no Geolocation API here (SSR, stripped webview). Not a failure; a capability answer.
 * - `failed` — anything else, carrying the normalized `Error`: an unrecognized code, an unreadable position, or
 *   a platform call that threw.
 */
export type PositionResult =
  | { readonly status: 'ok'; readonly position: Position }
  | { readonly status: 'denied' }
  | { readonly status: 'unavailable' }
  | { readonly status: 'timeout' }
  | { readonly status: 'unsupported' }
  | { readonly status: 'failed'; readonly error: Error };

/** The `status` discriminant of a {@link PositionResult} — for a consumer's own switch or status→copy map. */
export type PositionStatus = PositionResult['status'];

/**
 * Tunes a position request. Mirrors the platform's `PositionOptions`, restated here so the public API of this
 * slice owns its own input type and can document what each field actually costs.
 */
export interface PositionRequestOptions {
  /**
   * Asks for the most accurate fix the device can give — GPS rather than wifi/cell triangulation. Slower to
   * acquire and materially more battery-hungry; leave it off unless the accuracy genuinely changes the UI.
   */
  readonly enableHighAccuracy?: boolean;

  /**
   * Milliseconds to wait for a fix before answering `timeout`. Unset means wait indefinitely — which is why a
   * request with no timeout can leave a UI spinning forever indoors. A cold GPS fix can need 10–30s.
   */
  readonly timeout?: number;

  /**
   * Milliseconds a cached fix may be old and still be handed back instantly. `0` (the platform default) forces
   * a fresh acquisition every time; a few seconds is usually a better trade for a UI that asks repeatedly.
   */
  readonly maximumAge?: number;
}

/**
 * Reads the numeric `code` off a value of unknown provenance. Returns `null` for a missing or non-numeric code
 * and for an accessor that throws — a platform error object is read inside a callback, where an exception
 * cannot be caught by the original caller.
 */
function readErrorCode(raw: unknown): number | null {
  if (typeof raw !== 'object' || raw === null) return null;
  try {
    const code: unknown = (raw as Record<string, unknown>).code;
    return typeof code === 'number' ? code : null;
  } catch {
    return null;
  }
}

/**
 * Translates a value from a geolocation error callback into its {@link PositionResult}. Exported for the two
 * sibling entry points; absent from the barrel.
 *
 * Never throws — a hostile error object degrades to `failed`, never to an exception thrown inside a platform
 * callback.
 *
 * @param raw The value handed to a `getCurrentPosition` / `watchPosition` error callback.
 */
export function toPositionResult(raw: unknown): PositionResult {
  switch (readErrorCode(raw)) {
    case PermissionDeniedCode:
      return { status: 'denied' };
    case PositionUnavailableCode:
      return { status: 'unavailable' };
    case TimeoutCode:
      return { status: 'timeout' };
    default:
      return { status: 'failed', error: toError(raw) };
  }
}

/**
 * Translates a value from a geolocation success callback into its {@link PositionResult}, converting the host
 * object into a plain snapshot on the way. Exported for the two sibling entry points; absent from the barrel.
 *
 * A success callback that carries nothing readable becomes `failed` rather than `ok` with a hollow position —
 * a consumer must never receive a `status: 'ok'` it cannot plot.
 *
 * Never throws.
 *
 * @param raw The value handed to a `getCurrentPosition` / `watchPosition` success callback.
 */
export function toPositionSuccess(raw: unknown): PositionResult {
  const position = toPosition(raw);
  if (position === null) return { status: 'failed', error: new Error(UnreadablePositionMessage) };
  return { status: 'ok', position };
}
