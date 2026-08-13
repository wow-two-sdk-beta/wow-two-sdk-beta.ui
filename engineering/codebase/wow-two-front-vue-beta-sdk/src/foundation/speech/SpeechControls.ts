// The queue-level controls of the synthesis half — and the CANCEL GENERATION that lets `speak` tell "the engine
// reached the end of the text" from "something stopped it".
//
// WHY A COUNTER EXISTS AT ALL: the platform has no per-utterance cancel. `speechSynthesis.cancel()` clears the
// WHOLE queue, and what an interrupted utterance receives afterwards is engine-dependent — Chrome fires `end`
// (byte-for-byte indistinguishable from a natural finish), Firefox fires `error` with `canceled`. An
// `end`-means-spoken reading therefore reports success for a sentence the user cut off. Every `speak` records the
// counter before speaking and re-reads it on settle: a bump in between means a cancel reached it, whoever called
// it — this component's unmount, another component's button, or the handle's own `cancel()`.
//
// The bump happens BEFORE the platform call, not after. An engine (or a test double) that dispatches `end`
// synchronously from inside `cancel()` would otherwise run the handler while the counter still held its old
// value, and the utterance would report `spoken` for speech that was just cut off. Ordering the bump first makes
// the observation correct for both dispatch timings; the cost is that a `cancel()` which throws still counts as
// an intent to cancel, which is the right way round.
//
// EVERY CONTROL IS GLOBAL, and that is the platform's design, not a shortcut here: there is one utterance queue
// per document. `cancelSpeech()` from one component silences another component's speech. Components that must
// not interfere cannot be fixed at this layer — they have to coordinate above it.
//
// Platform caveat worth knowing before shipping a pause button: on Chrome for Android, `pause()` behaves like
// `cancel()` — the utterance does not resume. `pauseSpeech` reports only that the call was made.

import { speechSynthesisWith } from './SpeechSupport';

/** Bumped by every cancel that reaches a real engine. Read by `speak` to classify its own ending. */
let cancels = 0;

/**
 * The current cancel generation.
 *
 * Internal to the slice — `Speak` samples it before speaking and compares on settle. Absent from the barrel: the
 * number means nothing on its own, and a consumer comparing two samples is reimplementing `speak`.
 *
 * @returns A monotonically increasing count of cancels that reached the engine.
 */
export function cancelGeneration(): number {
  return cancels;
}

/**
 * Stops all speech and empties the utterance queue.
 *
 * GLOBAL: this silences every utterance in the document, not just the caller's. Any in-flight `speak` settles as
 * `cancelled` rather than `spoken` or `failed`.
 *
 * Never throws. A no-op under SSR.
 *
 * @returns `true` when a real engine was reached; `false` under SSR or when the call itself failed.
 */
export function cancelSpeech(): boolean {
  const synth = speechSynthesisWith('cancel');
  if (synth === undefined) return false;

  cancels += 1;
  try {
    synth.cancel();
    return true;
  } catch {
    // A `cancel()` that throws leaves speech running, and the generation already bumped — so an utterance that
    // survives will report `cancelled`. That is the safe way to be wrong: a cancelled-looking result for speech
    // the app asked to stop, rather than a `spoken` for speech it did not hear the end of.
    return false;
  }
}

/**
 * Pauses the current utterance, leaving the queue intact.
 *
 * Never throws. A no-op under SSR, and on engines that expose no `pause` (some mobile webviews). See the module
 * header for Chrome-on-Android's pause-is-cancel behaviour.
 *
 * @returns `true` when the call reached a real engine.
 */
export function pauseSpeech(): boolean {
  const synth = speechSynthesisWith('pause');
  if (synth === undefined) return false;

  try {
    synth.pause();
    return true;
  } catch {
    // A partial implementation refusing the call is reported, never thrown — the caller is a click handler.
    return false;
  }
}

/**
 * Resumes speech paused by {@link pauseSpeech}.
 *
 * Never throws. A no-op under SSR.
 *
 * @returns `true` when the call reached a real engine.
 */
export function resumeSpeech(): boolean {
  const synth = speechSynthesisWith('resume');
  if (synth === undefined) return false;

  try {
    synth.resume();
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether the engine is speaking right now.
 *
 * Reads the platform's own flag rather than a locally tracked one, so it stays true for speech this module did
 * not start. Note it stays `true` while PAUSED — that is the spec's definition, not a bug; pair it with
 * {@link isSpeechPaused}.
 *
 * Never throws. `false` under SSR.
 *
 * @returns The engine's `speaking` flag.
 */
export function isSpeaking(): boolean {
  const synth = speechSynthesisWith('speak');
  if (synth === undefined) return false;

  try {
    return synth.speaking === true;
  } catch {
    return false;
  }
}

/**
 * Whether the engine is in a paused state.
 *
 * Never throws. `false` under SSR.
 *
 * @returns The engine's `paused` flag.
 */
export function isSpeechPaused(): boolean {
  const synth = speechSynthesisWith('speak');
  if (synth === undefined) return false;

  try {
    return synth.paused === true;
  } catch {
    return false;
  }
}
