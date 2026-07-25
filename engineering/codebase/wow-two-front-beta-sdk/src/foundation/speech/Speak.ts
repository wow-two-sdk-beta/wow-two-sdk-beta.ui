// One call, four outcomes, no throw — the speaking half of the vector.
//
// DEFINING CONTRACT: NOTHING HERE THROWS. `speak` is called straight from a click handler, where a rejection is
// an unhandled error in the consumer's app and the user hears nothing and sees nothing. Every path — missing API,
// a cancel, an engine failure, a hostile option object — settles to a `SpeakResult` the caller switches on.
//
// THE RETURN IS BOTH A RESULT AND A HANDLE. `await speak(text)` gives the `SpeakResult`; keeping the return value
// gives `cancel` / `pause` / `resume` for speech that is still running. One object does both because the two are
// wanted at different moments by the same caller, and a separate `speakWithHandle` would duplicate the module.
// The handle is a `PromiseLike`, not a `Promise` subclass — awaiting is all a consumer needs, and `.spoken` is
// there for anyone who wants the real promise.
//
// The handle's controls are HONESTLY GLOBAL: the platform has no per-utterance cancel, so `handle.cancel()` is
// `cancelSpeech()` and clears the whole queue. Naming it on the handle is a convenience, not a narrowing.
//
// TWO ENGINE BUGS THIS MODULE ABSORBS:
//  - Utterance garbage collection. Chrome and WebKit have collected a `SpeechSynthesisUtterance` whose only
//    reference was the engine's own queue, and the utterance then falls silent with NO `end` event — a promise
//    that never settles. A module-level `Set` holds every in-flight utterance until it settles, which is the
//    known workaround and costs one reference per active utterance.
//  - Out-of-range `rate` / `pitch` / `volume`. The spec has the setter throw; engines disagree on whether they
//    throw or clamp. Values are clamped here BEFORE assignment, and a non-finite value is dropped rather than
//    clamped — `NaN` means the caller computed something wrong, and the engine default is a better answer than
//    an arbitrary pick from either end of the range.
//
// NOT worked around: Chrome stops synthesis after roughly 15 seconds of continuous speech. The known fix is a
// `pause()`/`resume()` heartbeat on a timer, which interferes with the global queue every consumer shares. Long
// text should be split into sentence-sized utterances by the caller instead.

import { toError } from '../errors';

import { cancelGeneration, cancelSpeech, pauseSpeech, resumeSpeech } from './SpeechControls';
import { speechSynthesisWith, utteranceConstructor } from './SpeechSupport';
import { toSpeakFailure, type SpeakResult } from './SpeechResult';

/** Tunes one utterance. Every field is optional; an omitted one leaves the engine's own default in place. */
export interface SpeakOptions {
  /** The voice to speak with — an entry from `listVoices()`. Omitted means the engine's default for `lang`. */
  readonly voice?: SpeechSynthesisVoice;

  /** BCP-47 language tag (`en-US`, `de`). Same vocabulary as `foundation/i18n`'s locale, which `useSpeechSynthesis` defaults it to. */
  readonly lang?: string;

  /** Speed, `0.1`–`10`, default `1`. Clamped to that range; a non-finite value is ignored. */
  readonly rate?: number;

  /** Pitch, `0`–`2`, default `1`. Clamped to that range; a non-finite value is ignored. */
  readonly pitch?: number;

  /** Volume, `0`–`1`, default `1`. Clamped to that range; a non-finite value is ignored. */
  readonly volume?: number;
}

/**
 * The return of {@link speak}: awaitable for the outcome, and callable for control while it runs.
 *
 * All three controls are GLOBAL — the platform exposes no per-utterance cancel or pause, so they act on the
 * document's whole utterance queue.
 */
export interface SpeechHandle extends PromiseLike<SpeakResult> {
  /** The underlying promise, for a caller that wants to store or pass it. Never rejects. */
  readonly spoken: Promise<SpeakResult>;

  /** Stops this utterance — and every other queued one. Settles the handle as `cancelled`. */
  readonly cancel: () => void;

  /** Pauses the engine. See `SpeechControls` for Chrome-on-Android's pause-is-cancel behaviour. */
  readonly pause: () => void;

  /** Resumes a paused engine. */
  readonly resume: () => void;
}

/**
 * Holds a reference to every utterance the engine is still working on, defeating the GC bug described in the
 * module header. Cleared on settle, so a page that speaks all day does not accumulate.
 */
const inFlight = new Set<SpeechSynthesisUtterance>();

/** Clamps to a spec range, dropping non-finite values so the engine keeps its own default. */
function clamp(value: number | undefined, min: number, max: number): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.min(max, Math.max(min, value));
}

/** Applies `options` to `utterance`, guarded — an engine may refuse a setter, and a refusal must not throw. */
function configure(utterance: SpeechSynthesisUtterance, options: SpeakOptions | undefined): void {
  if (options === undefined) return;

  try {
    if (options.voice !== undefined) utterance.voice = options.voice;
    if (options.lang !== undefined) utterance.lang = options.lang;

    const rate = clamp(options.rate, 0.1, 10);
    if (rate !== undefined) utterance.rate = rate;

    const pitch = clamp(options.pitch, 0, 2);
    if (pitch !== undefined) utterance.pitch = pitch;

    const volume = clamp(options.volume, 0, 1);
    if (volume !== undefined) utterance.volume = volume;
  } catch {
    // A setter that refused its value leaves the engine default in place, which is speakable. Losing the tuning
    // is strictly better than losing the utterance.
  }
}

/** Wraps a promise and a set of controls into the awaitable handle. */
function toHandle(spoken: Promise<SpeakResult>, controls: Omit<SpeechHandle, 'spoken' | 'then'>): SpeechHandle {
  return {
    spoken,
    cancel: controls.cancel,
    pause: controls.pause,
    resume: controls.resume,
    then: <TResult1 = SpeakResult, TResult2 = never>(
      onFulfilled?: ((value: SpeakResult) => TResult1 | PromiseLike<TResult1>) | null,
      onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> => spoken.then(onFulfilled, onRejected),
  };
}

/** The controls of a handle for speech that never started — every one a no-op. */
function inertControls(): Omit<SpeechHandle, 'spoken' | 'then'> {
  const noop = (): void => {
    // Nothing is speaking, so there is nothing to cancel, pause, or resume.
  };
  return { cancel: noop, pause: noop, resume: noop };
}

/**
 * Speaks `text` aloud, settling when the utterance ends.
 *
 * ```ts
 * const result = await speak('Order confirmed', { lang: 'en-GB', rate: 1.1 });
 * if (result.status === 'unsupported') showTextInstead();
 *
 * const handle = speak(longArticle);
 * stopButton.onclick = () => handle.cancel(); // settles as `cancelled`
 * ```
 *
 * Call it from a user gesture where possible: some engines refuse synthesis without one (arriving as `failed`
 * with a `not-allowed` code, since the API was present).
 *
 * Never throws, never rejects.
 *
 * @param text The text to speak. Empty text is handed to the engine unchanged — engines differ on whether they
 *   fire `end` for it, which is exactly the kind of thing a caller should not have to guess about mid-sentence.
 * @param options Voice, language, and prosody. Out-of-range prosody is clamped; see {@link SpeakOptions}.
 * @returns The awaitable handle — `spoken` / `cancelled` / `unsupported` / `failed`, plus the live controls.
 */
export function speak(text: string, options?: SpeakOptions): SpeechHandle {
  const synth = speechSynthesisWith('speak');
  const Utterance = utteranceConstructor();

  // Both globals or nothing: an engine with no `SpeechSynthesisUtterance` cannot be given anything to say.
  if (synth === undefined || Utterance === undefined) {
    return toHandle(Promise.resolve({ status: 'unsupported' }), inertControls());
  }

  let settle!: (result: SpeakResult) => void;
  const spoken = new Promise<SpeakResult>((resolve) => {
    settle = resolve;
  });

  let settled = false;
  let utterance: SpeechSynthesisUtterance | undefined;

  /** Settles once and drops the GC-guard reference. Engines fire both `end` and `error` in some cancel paths. */
  const finish = (result: SpeakResult): void => {
    if (settled) return;
    settled = true;
    if (utterance !== undefined) inFlight.delete(utterance);
    settle(result);
  };

  try {
    utterance = new Utterance(text);
  } catch (cause) {
    // A constructor that refused the text (a hostile value, a stripped polyfill) is a failure of this call, not
    // an absence of the feature — `unsupported` would send the caller looking for the wrong fix.
    return toHandle(Promise.resolve({ status: 'failed', error: toError(cause) }), inertControls());
  }

  configure(utterance, options);

  // Sampled BEFORE `speak`, so any cancel from this point on — ours or another component's — is observable when
  // the ending arrives. See `SpeechControls` for why an `end` event alone cannot answer this.
  const generation = cancelGeneration();
  const wasCancelled = (): boolean => cancelGeneration() !== generation;

  utterance.onend = (): void => {
    finish(wasCancelled() ? { status: 'cancelled' } : { status: 'spoken' });
  };

  utterance.onerror = (event): void => {
    // A cancel we already know about wins over the code: engines disagree on which code a cancelled utterance
    // carries (`canceled`, `interrupted`, and Safari has shipped others), and the counter is not a guess.
    finish(wasCancelled() ? { status: 'cancelled' } : toSpeakFailure(event));
  };

  inFlight.add(utterance);

  try {
    synth.speak(utterance);
  } catch (cause) {
    finish({ status: 'failed', error: toError(cause) });
  }

  return toHandle(spoken, {
    cancel: (): void => {
      cancelSpeech();
    },
    pause: (): void => {
      pauseSpeech();
    },
    resume: (): void => {
      resumeSpeech();
    },
  });
}
