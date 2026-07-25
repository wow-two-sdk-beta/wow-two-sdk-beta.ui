// The result vocabulary of the recognition half, and the error-code table that produces it. THIS TABLE IS THE
// MODULE'S REAL VALUE: one `error` event carries at least six situations that a user resolves in six different
// ways — a blocked microphone (browser settings), no microphone at all (plug one in), a dropped network (Chrome
// streams audio to a Google server, so recognition dies offline while synthesis keeps working), silence (speak
// louder), an abort the app itself asked for (say nothing), and a language the service will not transcribe (pick
// another). A consumer that renders one "speech recognition failed" message for all six is unhelpable.
//
// The vocabulary deliberately REUSES `foundation/media`'s words where the situation is the same one: `denied` for
// a refused permission, `unavailable` for a missing device, `unsupported` for a missing API, `failed` for the
// rest. A microphone denial is a microphone denial whether it arrived through `getUserMedia` or through
// recognition, and two spellings of it would force every consumer to write the mapping twice.
//
// Codes mapped away from their literal name, each for a reason:
//  - `service-not-allowed` → `denied`. Chrome sends this when the BROWSER or OS blocks the speech service rather
//    than the user — including on an insecure origin. Different cause, identical remedy path for the user, and
//    splitting it would give consumers a status with no distinct copy to write.
//  - `audio-capture` → `unavailable`. The literal meaning is "no input device was usable", which is
//    `foundation/media`'s `unavailable`, not a failure.
//  - `bad-grammar` → `failed`. It means the app supplied a grammar the engine rejected — a programmer error that
//    deserves the real `Error`, and this slice does not expose grammars at all.
//
// `aborted` is a first-class status rather than an error for the same reason `foundation/share` keeps
// `dismissed`: it is what the app's own `abort()` produces (an unmount, a cancel button), and reporting the app's
// own decision back to the user as a failure raises a toast for something nobody did wrong.

/**
 * Why a recognition session ended badly. Eight arms, four of them sharing `foundation/media`'s vocabulary.
 *
 * - `denied` — the microphone is blocked, by the user or by the browser / OS. Not retryable without a settings
 *   change, so re-prompting on a timer only annoys.
 * - `unavailable` — no usable input device. A desktop with no microphone, or an unplugged one.
 * - `no-speech` — the engine listened and heard nothing. Ordinary, and the most common ending of all: expect it
 *   whenever a user presses the button and hesitates.
 * - `network` — the recognition service was unreachable. Chrome performs recognition SERVER-SIDE, so this is
 *   routine offline, and no amount of retrying fixes it without a connection.
 * - `aborted` — the app stopped the session (`abort()`, an unmount). A decision, not a failure.
 * - `language-unsupported` — the service will not transcribe the requested `lang`.
 * - `unsupported` — no recognition API here: SSR, or Firefox, which does not implement it.
 * - `failed` — anything else, including an unreadable event.
 */
export type SpeechRecognitionStatus =
  | 'denied'
  | 'unavailable'
  | 'no-speech'
  | 'network'
  | 'aborted'
  | 'language-unsupported'
  | 'unsupported'
  | 'failed';

/** A recognition failure: the classified status plus a normalized `Error` for logs and telemetry. */
export interface SpeechRecognitionFailure {
  /** What went wrong, in terms a UI can branch on. */
  readonly status: SpeechRecognitionStatus;

  /** The normalized error, always present — carrying the raw platform code in its message. */
  readonly error: Error;
}

/** One transcription update — interim or final — as handed to a recognizer's callbacks. */
export interface SpeechTranscript {
  /** The recognized text. */
  readonly transcript: string;

  /** `true` once the engine has committed to this phrase; `false` while it is still revising it. */
  readonly isFinal: boolean;

  /** The engine's `0`–`1` confidence. Chrome reports `0` for interim results — a hint, never a gate. */
  readonly confidence: number;
}

/** Platform error code → status. Everything absent from this table lands on `failed` with the real code kept. */
const StatusByCode: Readonly<Record<string, SpeechRecognitionStatus>> = {
  'not-allowed': 'denied',
  'service-not-allowed': 'denied',
  'audio-capture': 'unavailable',
  'no-speech': 'no-speech',
  network: 'network',
  aborted: 'aborted',
  'language-not-supported': 'language-unsupported',
};

/** Reads a member as a string, guarded — a throwing getter reads as absent rather than as a second failure. */
function stringMember(value: unknown, key: string): string | undefined {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return undefined;

  try {
    const member: unknown = (value as Record<string, unknown>)[key];
    return typeof member === 'string' ? member : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Classifies a recognition `error` event into its {@link SpeechRecognitionFailure}.
 *
 * Matched on the `error` string rather than an `instanceof`, for the same reason `foundation/media` matches
 * `DOMException` names: the event type is non-standard, differs between Chrome and Safari, and a test double
 * throws a plain `{ error: 'no-speech' }`.
 *
 * Never throws. An unreadable event becomes `failed` carrying an `Error` that says so.
 *
 * @param event The `error` event the engine delivered.
 * @returns The classified failure.
 */
export function toSpeechRecognitionFailure(event: unknown): SpeechRecognitionFailure {
  const code = stringMember(event, 'error');
  const detail = stringMember(event, 'message');
  const status = code === undefined ? 'failed' : (StatusByCode[code] ?? 'failed');

  const message =
    detail === undefined || detail === ''
      ? `speech recognition error: ${code ?? 'unknown'}`
      : `speech recognition error: ${code ?? 'unknown'} — ${detail}`;

  // The raw event rides as `cause`; `foundation/errors`' chain walkers traverse it safely (cycle-guarded).
  return { status, error: new Error(message, { cause: event }) };
}
