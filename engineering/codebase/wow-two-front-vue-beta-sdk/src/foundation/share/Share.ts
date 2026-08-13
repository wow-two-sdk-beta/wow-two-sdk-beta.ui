// The native half of the share vector: one call, four outcomes, no throw.
//
// DEFINING CONTRACT: NOTHING HERE THROWS. This is called straight from a click handler, where a rejection is an
// unhandled error in the consumer's app and the user sees nothing at all. Every path — missing API, user
// dismissal, platform failure, even an `onError` callback that itself throws — resolves to a `ShareResult` the
// caller switches on.
//
// The dismissal case is the reason the result is a union rather than a boolean. Closing the share sheet rejects
// the very same promise a genuine failure does, distinguished only by an `AbortError` name; reported as a
// failure it raises a toast for something the user deliberately did. So it gets its own status and never reaches
// `onError`. The recognizer is `foundation/errors`' `isAbortError`, which matches on `name` — so it holds for a
// `DOMException` from another realm and for the plain `{ name: 'AbortError' }` a test double throws.

import { isAbortError, toError } from '../errors';

import { canShare } from './CanShare';
import { toNativeSharePayload, type ShareData } from './ShareData';

/**
 * The outcome of a share attempt.
 *
 * - `shared` — the native sheet completed. The platform does not report *which* target was picked, nor whether
 *   the receiving app did anything with the payload, so this is "handed off", not "delivered".
 * - `dismissed` — the user closed the sheet. A decision, not an error.
 * - `unsupported` — no Web Share here: desktop browser, SSR, or a files payload the platform refused.
 * - `failed` — anything else, carrying the normalized `Error`.
 */
export type ShareResult =
  | { readonly status: 'shared' }
  | { readonly status: 'dismissed' }
  | { readonly status: 'unsupported' }
  | { readonly status: 'failed'; readonly error: Error };

/** The `status` discriminant of a {@link ShareResult} — for a consumer's own switch or status→copy map. */
export type ShareStatus = ShareResult['status'];

/** Tunes a share attempt. */
export interface ShareOptions {
  /**
   * Called with the normalized error on a `failed` result — the seam for a toast or telemetry hook. Never called
   * for `dismissed` or `unsupported`, neither of which is a failure. A throw from this callback is swallowed.
   */
  readonly onError?: (error: Error) => void;
}

/**
 * Hands a consumer's callback the failure, absorbing a throw from the callback itself. A reporter that throws
 * must not convert a typed result into an unhandled rejection. Exported for the sibling fallback module; absent
 * from the barrel.
 */
export function reportShareError(onError: ShareOptions['onError'], error: Error): void {
  if (onError === undefined) return;
  try {
    onError(error);
  } catch {
    // The consumer's own reporter failed. There is nothing useful left to do with that — the result still
    // reaches the caller, which is the guarantee that matters.
  }
}

/**
 * Opens the native share sheet for `data` and resolves to a {@link ShareResult}.
 *
 * Call it from a user gesture: browsers require transient activation for the sheet, and without one the platform
 * rejects — which surfaces as `failed`, not `unsupported`, since the API was in fact present.
 *
 * Never throws, never rejects.
 */
export async function share(data: ShareData, options?: ShareOptions): Promise<ShareResult> {
  if (!canShare(data)) return { status: 'unsupported' };

  try {
    await navigator.share(toNativeSharePayload(data));
    return { status: 'shared' };
  } catch (error) {
    // The user's own decision ends the flow quietly — no `onError`, no fallback downstream.
    if (isAbortError(error)) return { status: 'dismissed' };

    const failure = toError(error);
    reportShareError(options?.onError, failure);
    return { status: 'failed', error: failure };
  }
}
