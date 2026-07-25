// The vocabulary every entry point in this slice answers in — the result unions, the options, and the helpers
// that build a result from a caught value.
//
// WHY A DISCRIMINATED RESULT AND NOT A PROMISE THAT REJECTS. A clipboard write fails for four reasons that a UI
// must render differently: the API is absent (render a manual "select and press Ctrl+C" affordance), the user or
// the platform refused (explain the permission), the platform broke (a toast), or it worked. Collapsing those
// into "rejected" throws away the distinction, and collapsing them into React state — what
// `foundation/hooks`' `useClipboard` does — makes the outcome unreadable to any caller that is not a component.
// So every entry point resolves to one of these unions and NOTHING in the slice throws.
//
// The three non-success arms are ONE type ({@link ClipboardFailure}) shared by the write and both read results,
// not three parallel copies. Reading and writing fail for exactly the same reasons, so a consumer writes one
// error renderer, and the helpers below build a value assignable to every result union.
//
// `denied` is split out from `failed` on the error's `name`, not its message: `NotAllowedError` is what the
// platform raises when the permission was refused or there was no transient activation, and `SecurityError` is
// what some engines raise for the same call in a non-secure context. Both mean "the platform refused", which is
// a different repair for the user (grant the permission / use HTTPS) than "the platform broke".
//
// Matching on `name` rather than `instanceof DOMException` is deliberate, for the same reason
// `foundation/errors`' recognizers do it: the check has to hold for a `DOMException` from another realm, for
// environments with no `DOMException` global, and for the plain `{ name: 'NotAllowedError' }` a test double
// throws.

import { toError } from '../errors';

/**
 * The ways a clipboard operation ends without producing a payload. Shared by {@link ClipboardWriteResult} and
 * both read results, so one `switch` renders every error path in the slice.
 *
 * - `denied` — the platform refused: permission not granted, the paste prompt dismissed, or no user gesture
 *   behind the call.
 * - `unsupported` — no Clipboard API here: SSR, a non-secure context, or an engine without the method. A
 *   capability fact, not a failure — nothing went wrong, the road is simply not there.
 * - `failed` — anything else, carrying the normalized `Error`.
 */
export type ClipboardFailure =
  | { readonly status: 'denied'; readonly error: Error }
  | { readonly status: 'unsupported' }
  | { readonly status: 'failed'; readonly error: Error };

/** The outcome of a clipboard write — `copied` on success, otherwise a {@link ClipboardFailure}. */
export type ClipboardWriteResult = { readonly status: 'copied' } | ClipboardFailure;

/** The `status` discriminant of a {@link ClipboardWriteResult} — for a consumer's own switch or status→copy map. */
export type ClipboardWriteStatus = ClipboardWriteResult['status'];

/** One MIME-typed payload read off the system clipboard. */
export interface ClipboardReadItem {
  /** The MIME type the platform reported — `text/plain`, `text/html`, `image/png`, … */
  readonly type: string;

  /** The payload itself. Read it with `blob.text()` for textual types, or hand it to `URL.createObjectURL`. */
  readonly blob: Blob;
}

/**
 * The outcome of a clipboard text read. `read` carries the text — an empty clipboard reads as `''`, which is a
 * successful read of nothing rather than a failure.
 */
export type ClipboardReadTextResult = { readonly status: 'read'; readonly text: string } | ClipboardFailure;

/** The outcome of a multi-format clipboard read. `read` carries one entry per MIME type the platform offered. */
export type ClipboardReadItemsResult =
  | { readonly status: 'read'; readonly items: readonly ClipboardReadItem[] }
  | ClipboardFailure;

/** The `status` discriminant shared by both read results. */
export type ClipboardReadStatus = ClipboardReadTextResult['status'];

/** Tunes a clipboard read. */
export interface ClipboardReadOptions {
  /**
   * Called with the normalized error on a `denied` or `failed` result — the seam for a toast or telemetry hook.
   * Never called for `unsupported`, which is a capability fact rather than a failure. A throw from this callback
   * is swallowed. Called at most once per operation, on the final result.
   */
  readonly onError?: (error: Error) => void;
}

/** Tunes a clipboard write. */
export interface ClipboardCopyOptions extends ClipboardReadOptions {
  /**
   * Whether a write the Clipboard API cannot complete retries through the deprecated
   * `document.execCommand('copy')` path. Defaults to `false`.
   *
   * Opt in for reach — older Safari and any non-secure context have no `navigator.clipboard` at all, and
   * `execCommand` is the only write available there. Leave it off to stay on standards-track APIs only. See
   * `LegacyCopy.ts` for the deprecation caveats and for exactly when the retry runs.
   */
  readonly legacyFallback?: boolean;
}

/** The shape every result family shares, so one reporter can serve every entry point. */
type ClipboardOutcome = { readonly status: string; readonly error?: Error };

/** Reads a caught value's `name` as a string. Guarded, so a throwing getter reads as absent. */
function nameOf(value: unknown): string | undefined {
  try {
    if (typeof value !== 'object' || value === null) return undefined;
    const name: unknown = (value as { name?: unknown }).name;
    return typeof name === 'string' ? name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Checks whether a caught value is the platform refusing rather than breaking — the split behind `denied`.
 * Exported for the sibling modules; absent from the barrel, where the statuses are the answer callers want.
 *
 * @param value The caught value.
 */
export function isPermissionRefusal(value: unknown): boolean {
  const name = nameOf(value);
  return name === 'NotAllowedError' || name === 'SecurityError';
}

/**
 * Turns a caught value into the `denied` or `failed` arm it belongs in. Serves reads and writes alike — the
 * returned {@link ClipboardFailure} is assignable to every result union in the slice. Exported for the sibling
 * modules; absent from the barrel. Never throws: `toError` is total.
 *
 * @param error The caught value.
 */
export function toClipboardFailure(error: unknown): ClipboardFailure {
  const failure = toError(error);
  return isPermissionRefusal(error) ? { status: 'denied', error: failure } : { status: 'failed', error: failure };
}

/**
 * Hands a consumer's callback the failure carried by `result`, absorbing a throw from the callback itself. A
 * reporter that throws must not convert a typed result into an unhandled rejection.
 *
 * Called once per entry point, on the FINAL result — so a write that degrades through the legacy fallback
 * reports the outcome the caller receives, not each intermediate attempt. Exported for the sibling modules;
 * absent from the barrel.
 *
 * @param result The outcome about to be returned.
 * @param onError The consumer's reporter, if they supplied one.
 * @returns `result`, unchanged — so a call site can `return reportClipboardOutcome(...)`.
 */
export function reportClipboardOutcome<TResult extends ClipboardOutcome>(
  result: TResult,
  onError: ((error: Error) => void) | undefined,
): TResult {
  if (onError === undefined) return result;
  if (result.error === undefined) return result;

  try {
    onError(result.error);
  } catch {
    // The consumer's own reporter failed. There is nothing useful left to do with that — the result still
    // reaches the caller, which is the guarantee that matters.
  }
  return result;
}
