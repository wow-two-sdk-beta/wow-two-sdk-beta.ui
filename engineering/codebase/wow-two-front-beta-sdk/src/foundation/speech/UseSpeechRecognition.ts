// The React binding of the recognition half. Like its synthesis sibling, the line that earns the file is the
// UNMOUNT: a live recognition session holds the microphone open and — in Chrome — keeps streaming audio to a
// remote service. A component that navigates away mid-session leaves the recording indicator on, so the cleanup
// calls `abort()`, not `stop()`: `stop()` asks for one last transcript nobody is left to receive.
//
// THE RECOGNIZER IS CREATED LAZILY, ON FIRST `start()`, not during render and not in a mount effect. Constructing
// during render would build a second instance under StrictMode's double render and leak the first; constructing
// in an effect would leave `start` unusable on the render before effects run. A lazy getter avoids both, and a
// user who never presses the button never constructs anything.
//
// CHANGING `lang` REBUILDS IT. The platform reads the language when a session starts and offers no way to
// reconfigure a running recognizer, so a locale switch aborts the current instance and drops it; the next
// `start()` builds one with the new tag. Aborting mid-session is the honest behaviour — the alternative is
// transcribing the rest of the sentence in the previous language.
//
// TRANSCRIPT ACCUMULATES ACROSS THE SESSION; interim text does not. A final result is appended to `transcript`
// and clears `interimTranscript`, so a consumer renders `transcript + interimTranscript` and gets the natural
// "committed text, then greyed-out live text" without tracking anything itself. `reset()` clears both.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { useLocale } from '../i18n';

import { createSpeechRecognizer, type RecognizerStartResult, type SpeechRecognizer, type SpeechRecognizerOptions } from './CreateSpeechRecognizer';
import { canRecognizeSpeech } from './SpeechSupport';
import type { SpeechRecognitionFailure } from './SpeechRecognitionResult';

/** Options for {@link useSpeechRecognition} — the recognizer's own, with the hook layering state on top. */
export type UseSpeechRecognitionOptions = SpeechRecognizerOptions;

/** What {@link useSpeechRecognition} returns. */
export interface SpeechRecognitionControls {
  /** Whether this browser can transcribe at all. `false` under SSR and in Firefox — gate the button on it. */
  readonly supported: boolean;

  /** Whether the engine is listening. `false` in the gap between `start()` and the engine actually opening the microphone. */
  readonly listening: boolean;

  /** Every committed phrase of the session, space-joined. Survives an ended session; cleared by `reset`. */
  readonly transcript: string;

  /** The current uncommitted text. Requires `interimResults`; cleared when the phrase commits or the session ends. */
  readonly interimTranscript: string;

  /** The last classified failure, or `null`. Cleared when a new session starts. `no-speech` lands here too. */
  readonly error: SpeechRecognitionFailure | null;

  /** Begins a session. Safe to call twice — the second answers `already-started`. Stable across renders. */
  readonly start: () => RecognizerStartResult;

  /** Ends the session, keeping what the engine already recognized. Stable across renders. */
  readonly stop: () => void;

  /** Ends the session immediately, discarding pending results. Stable across renders. */
  readonly abort: () => void;

  /** Clears `transcript`, `interimTranscript`, and `error`. Does not touch the session. Stable across renders. */
  readonly reset: () => void;
}

/** A subscribe that never notifies — recognition support cannot change within a session. */
function neverChanges(): () => void {
  return (): void => {
    // Nothing was subscribed, so there is nothing to unsubscribe.
  };
}

/** The SSR snapshot: a server cannot transcribe, and claiming otherwise would mismatch the first client render. */
function notSupportedOnServer(): boolean {
  return false;
}

/** Appends a committed phrase, space-joined, skipping the empty results an engine occasionally commits. */
function appendPhrase(previous: string, phrase: string): string {
  const next = phrase.trim();
  if (next === '') return previous;
  return previous === '' ? next : `${previous} ${next}`;
}

/**
 * Transcribes speech into accumulating state, aborting the session on unmount.
 *
 * ```tsx
 * const dictation = useSpeechRecognition({ interimResults: true, continuous: true });
 * <button disabled={!dictation.supported} onClick={() => dictation.start()}>
 *   {dictation.listening ? 'Listening…' : 'Dictate'}
 * </button>
 * <p>{dictation.transcript} <em>{dictation.interimTranscript}</em></p>
 * ```
 *
 * `lang` defaults to the active `LocaleProvider` locale, so a localized app transcribes the language its user is
 * reading. Every callback is stable across renders; nothing throws.
 *
 * @param options Session shape and pass-through callbacks — each is called in addition to the state updates.
 * @returns The transcript state plus the four controls.
 */
export function useSpeechRecognition(options?: UseSpeechRecognitionOptions): SpeechRecognitionControls {
  const { locale } = useLocale();

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<SpeechRecognitionFailure | null>(null);

  const supported = useSyncExternalStore(neverChanges, canRecognizeSpeech, notSupportedOnServer);

  // Options and locale ride refs so a fresh `{ onFinal }` literal each render does not churn the callbacks — the
  // same shape `useShare` and `useMediaStream` use.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const localeRef = useRef(locale);
  localeRef.current = locale;

  const mountedRef = useRef(true);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);

  const getRecognizer = useCallback((): SpeechRecognizer => {
    const existing = recognizerRef.current;
    if (existing !== null) return existing;

    const created = createSpeechRecognizer({
      lang: optionsRef.current?.lang ?? localeRef.current,
      continuous: optionsRef.current?.continuous,
      // Interim results default ON here, unlike the bare recognizer: a hook exposing `interimTranscript` that is
      // permanently empty is a worse default than one that costs a few extra re-renders.
      interimResults: optionsRef.current?.interimResults ?? true,
      maxAlternatives: optionsRef.current?.maxAlternatives,

      onStart: (): void => {
        if (mountedRef.current) {
          setListening(true);
          setError(null);
        }
        optionsRef.current?.onStart?.();
      },

      onEnd: (): void => {
        if (mountedRef.current) {
          setListening(false);
          // Uncommitted text belongs to a session that no longer exists; keeping it would render as live speech.
          setInterimTranscript('');
        }
        optionsRef.current?.onEnd?.();
      },

      onError: (failure): void => {
        if (mountedRef.current) setError(failure);
        optionsRef.current?.onError?.(failure);
      },

      onResult: (result): void => {
        if (mountedRef.current) {
          if (result.isFinal) {
            setTranscript((previous) => appendPhrase(previous, result.transcript));
            setInterimTranscript('');
          } else {
            setInterimTranscript(result.transcript);
          }
        }
        optionsRef.current?.onResult?.(result);
      },

      onFinal: (text): void => {
        optionsRef.current?.onFinal?.(text);
      },

      onInterim: (text): void => {
        optionsRef.current?.onInterim?.(text);
      },
    });

    recognizerRef.current = created;
    return created;
  }, []);

  const start = useCallback((): RecognizerStartResult => getRecognizer().start(), [getRecognizer]);

  // `stop` / `abort` read the ref instead of the getter: nothing can be running if nothing was ever built, and
  // constructing a recognizer in order to stop it would open the very session being cancelled.
  const stop = useCallback((): void => {
    recognizerRef.current?.stop();
  }, []);

  const abort = useCallback((): void => {
    recognizerRef.current?.abort();
  }, []);

  const reset = useCallback((): void => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const lang = options?.lang ?? locale;
  const continuous = options?.continuous ?? false;
  const interimResults = options?.interimResults ?? true;

  useEffect(() => {
    // Config is applied at construction, so a change means a new instance. Aborting first is deliberate: a
    // session already running under the old language cannot be re-tagged mid-sentence. A no-op on mount.
    recognizerRef.current?.abort();
    recognizerRef.current = null;
  }, [lang, continuous, interimResults]);

  useEffect(() => {
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
      // `abort`, never `stop`: nothing is left to receive a final transcript, and the microphone must close now.
      recognizerRef.current?.abort();
      recognizerRef.current = null;
    };
  }, []);

  return { supported, listening, transcript, interimTranscript, error, start, stop, abort, reset };
}
