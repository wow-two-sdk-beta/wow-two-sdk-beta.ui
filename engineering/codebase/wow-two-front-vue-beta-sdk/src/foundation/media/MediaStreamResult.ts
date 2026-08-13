// The result vocabulary of the capture vector, and the `DOMException`-name table that produces it. This mapping
// is the substance of the whole slice: `getUserMedia` rejects with a handful of names that mean completely
// different things to a user, and a consumer that only sees "the promise rejected" renders one useless message
// for all of them — "camera unavailable" to someone who simply pressed Block, whose fix is a browser setting.
//
// Matched on `name`, deliberately not `instanceof DOMException` — the same posture as `foundation/errors`'
// `isAbortError`. The check has to hold for a `DOMException` from another realm (iframe · worker), for engines
// where these arrive as plain `Error`s, and for the `{ name: 'NotAllowedError' }` a test double throws.
//
// Legacy names are first-class, not politeness: `PermissionDeniedError` (older Chrome), `DevicesNotFoundError`
// (older Firefox), and `TrackStartError` (older Chrome) are what those engines actually throw, and a table that
// omits them silently downgrades a denial to a generic failure on exactly the browsers most likely to hit it.
//
// Names deliberately left OUT of the table, all landing on `failed`:
//  - `OverconstrainedError` — a constraint the device cannot satisfy. Tempting to call `unavailable`, but the
//    device usually exists and the caller's constraints are the bug (`facingMode: { exact }` on a desktop is the
//    classic). Burying it as "no camera" hides a fixable mistake in the consumer's own code.
//  - `AbortError` — the device was taken away mid-acquisition by the OS. Rare and genuinely exceptional.
//  - `SecurityError` / `TypeError` — capture disabled by policy, or malformed constraints. Both are programmer
//    or deployment errors, and both deserve the real `Error` rather than a soothing status.

import { toError } from '../errors';

/**
 * The outcome of a capture attempt. Six arms because a camera prompt has six meaningfully different endings,
 * each wanting different UI copy and a different next step.
 *
 * - `granted` — the user allowed it; `stream` is live and the caller now OWNS it (see `stopMediaStream`).
 * - `denied` — the user pressed Block, or a prior block is being replayed without a prompt. Not retryable
 *   without a browser-settings change, so re-prompting on a timer only annoys.
 * - `unavailable` — no device matches the request. A laptop with no webcam, or an unplugged USB mic.
 * - `in-use` — the device exists but another application (or another tab) holds it. Retryable once freed.
 * - `unsupported` — no API here at all: SSR, an insecure context, an older browser. See `getMediaSupport` for
 *   which of those it is.
 * - `failed` — anything else, carrying the normalized `Error`.
 */
export type MediaStreamResult =
  | { readonly status: 'granted'; readonly stream: MediaStream }
  | { readonly status: 'denied' }
  | { readonly status: 'unavailable' }
  | { readonly status: 'in-use' }
  | { readonly status: 'unsupported' }
  | { readonly status: 'failed'; readonly error: Error };

/** The `status` discriminant of a {@link MediaStreamResult} — for a consumer's own switch or status→copy map. */
export type MediaStreamStatus = MediaStreamResult['status'];

/** Every {@link MediaStreamResult} arm except the successful one — what a rejected `getUserMedia` can become. */
export type MediaStreamFailure = Exclude<MediaStreamResult, { status: 'granted' }>;

/**
 * Reads a caught value's `name` as a string. Guarded: a throwing getter or a `Proxy` trap reads as absent rather
 * than escalating into a second failure inside the `catch` that is already handling the first.
 */
function nameOf(value: unknown): string | undefined {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return undefined;

  try {
    const name: unknown = (value as Record<string, unknown>)['name'];
    return typeof name === 'string' ? name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Classifies a rejected `getUserMedia` into its {@link MediaStreamFailure}.
 *
 * Exported for the sibling request modules and their tests; absent from the barrel, where the request functions
 * are the surface a consumer wants. Never throws — an unrecognized name falls through to `failed` with the value
 * normalized by `foundation/errors`' `toError`, so even a thrown `null` arrives as a real `Error`.
 *
 * @param cause The value `getUserMedia` rejected (or threw) with.
 * @returns The matching failure arm.
 */
export function toMediaStreamFailure(cause: unknown): MediaStreamFailure {
  switch (nameOf(cause)) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return { status: 'denied' };

    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return { status: 'unavailable' };

    case 'NotReadableError':
    case 'TrackStartError':
      return { status: 'in-use' };

    default:
      return { status: 'failed', error: toError(cause) };
  }
}
