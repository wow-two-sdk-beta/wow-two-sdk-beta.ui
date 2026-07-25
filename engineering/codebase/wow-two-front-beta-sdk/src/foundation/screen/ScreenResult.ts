// The result vocabulary every entry point in this slice returns. One union, five statuses, so a consumer writes
// one `switch` and reuses it across fullscreen, wake lock, and orientation instead of learning three shapes.
//
// WHY A UNION AND NOT A THROW: every action here is invoked straight from a click handler. A rejected promise is
// an unhandled error in the consumer's app and the user sees nothing at all — the same reasoning that shapes
// `foundation/share`. So the contract is total: no entry point throws or rejects, ever.
//
// WHY FIVE STATUSES AND NOT A BOOLEAN: the failures need different UI. `unsupported` should hide the control
// entirely (a desktop browser has no wake lock, and a disabled button for it is noise). `denied` should explain
// that the platform said no. `requires-gesture` is the one the developer caused — the call escaped its user
// gesture — and is recoverable by moving it into a click handler, so it must not be buried in `failed`. Folding
// any of these into a single `false` loses the only information that decides what to render next.
//
// `unsupported` deliberately carries NO error: nothing was called, so there is nothing to report. The other three
// all carry the normalized `Error` (via `foundation/errors`' `toError`), so telemetry keeps the original name and
// stack even after the status has been decided.

/**
 * The non-success half of {@link ScreenResult}, shared by the value-carrying and void variants.
 *
 * - `unsupported` — the API is absent: SSR, an older browser, or a platform that cannot honour the request at
 *   all. Carries no error because no call was made. Hide the affordance rather than disabling it.
 * - `denied` — the API exists and the platform refused. A permissions policy, an OS-level block, or a
 *   precondition the caller cannot satisfy. Not retryable by repeating the same call.
 * - `requires-gesture` — the call was made outside a user gesture (transient activation). Retryable: move it
 *   into a `click` / `keydown` handler. Its own status precisely because the fix is mechanical.
 * - `failed` — anything else, carrying the normalized `Error`.
 */
export type ScreenFailure =
  | { readonly status: 'unsupported' }
  | { readonly status: 'denied'; readonly error: Error }
  | { readonly status: 'requires-gesture'; readonly error: Error }
  | { readonly status: 'failed'; readonly error: Error };

/** The outcome of a screen action that yields nothing on success — entering fullscreen, unlocking orientation. */
export type ScreenResult = { readonly status: 'ok' } | ScreenFailure;

/**
 * The outcome of a screen action that yields a `TValue` on success — the wake-lock handle, today's only case.
 * The failure legs are identical to {@link ScreenResult}'s, so `result.status === 'ok'` narrows to the value and
 * every other branch reads the same as it does elsewhere in the slice.
 */
export type ScreenValueResult<TValue> =
  | { readonly status: 'ok'; readonly value: TValue }
  | ScreenFailure;

/** The `status` discriminant of a {@link ScreenResult} — for a consumer's own status→copy map. */
export type ScreenStatus = ScreenResult['status'];
