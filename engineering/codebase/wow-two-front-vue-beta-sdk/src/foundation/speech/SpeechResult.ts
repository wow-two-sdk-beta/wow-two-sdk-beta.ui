// The result vocabulary of the synthesis half, and the error-code table that produces it.
//
// The table's whole job is separating "the app stopped this" from "the engine failed". `speechSynthesis.cancel()`
// reaches the utterance as an `error` event carrying `canceled` or `interrupted` — the same event shape a genuine
// synthesis failure arrives in — so a consumer that reads every `error` as a failure raises a toast every time a
// component unmounts mid-sentence. `cancelled` is therefore a status of its own, and never carries an `Error`.
//
// (`canceled`, one `l`, is the platform's spelling. The status this slice exposes is `cancelled` — matching the
// repo's own English, and `foundation/share`'s `dismissed`, which draws the same line for the same reason.)
//
// Codes deliberately landing on `failed`, all carrying the real `Error`:
//  - `audio-busy` / `audio-hardware` — the output device is unavailable. Retryable, but not by us.
//  - `synthesis-unavailable` / `synthesis-failed` — the engine gave up on text it accepted.
//  - `language-unavailable` / `voice-unavailable` — the requested `lang` / `voice` has no engine behind it. A
//    consumer bug worth surfacing: silently falling back to the default voice hides a wrong language tag.
//  - `text-too-long` / `invalid-argument` / `not-allowed` — programmer errors, and `not-allowed` specifically
//    means synthesis was refused without a user gesture. All three deserve the error, not a soothing status.

/**
 * The outcome of a {@link speak} attempt. Four arms because an utterance has four meaningfully different endings.
 *
 * - `spoken` — the engine reached the end of the text. It does NOT mean anyone heard it: the device may be muted.
 * - `cancelled` — something called `cancelSpeech` (or the handle's `cancel`) before it finished. A decision, not
 *   an error, and never reported as one.
 * - `unsupported` — no `speechSynthesis` / `SpeechSynthesisUtterance` here: SSR, or a stripped webview.
 * - `failed` — anything else, carrying the normalized `Error`.
 */
export type SpeakResult =
  | { readonly status: 'spoken' }
  | { readonly status: 'cancelled' }
  | { readonly status: 'unsupported' }
  | { readonly status: 'failed'; readonly error: Error };

/** The `status` discriminant of a {@link SpeakResult} — for a consumer's own switch or status→copy map. */
export type SpeakStatus = SpeakResult['status'];

/** Codes that mean the app (or the user) stopped the utterance, rather than the engine failing to speak it. */
const CancellationCodes: ReadonlySet<string> = new Set(['canceled', 'cancelled', 'interrupted']);

/**
 * Reads a caught / delivered value's `error` code as a string. Guarded: a throwing getter or a `Proxy` trap reads
 * as absent rather than escalating inside the handler that is already dealing with a failure.
 */
function errorCodeOf(event: unknown): string | undefined {
  if (event === null || (typeof event !== 'object' && typeof event !== 'function')) return undefined;

  try {
    const code: unknown = (event as Record<string, unknown>)['error'];
    return typeof code === 'string' ? code : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Classifies a `SpeechSynthesisUtterance` `error` event into its {@link SpeakResult}.
 *
 * Exported for the sibling `Speak` module and its tests; absent from the barrel, where `speak` is the surface a
 * consumer wants. Never throws — an unrecognized or unreadable code becomes `failed` with an `Error` naming what
 * arrived, so even a hostile event produces a usable result.
 *
 * @param event The `error` event the platform delivered.
 * @returns `cancelled` for a cancellation code, `failed` for everything else.
 */
export function toSpeakFailure(event: unknown): SpeakResult {
  const code = errorCodeOf(event);
  if (code !== undefined && CancellationCodes.has(code)) return { status: 'cancelled' };

  // The raw event rides along as `cause`, which `foundation/errors`' chain walkers already traverse safely
  // (cycle-guarded, depth-capped) — so a log keeps the platform's own object without this module trusting it.
  const error = new Error(`speech synthesis failed: ${code ?? 'unknown'}`, { cause: event });
  return { status: 'failed', error };
}
