// The React binding of the synthesis half — and the reason it exists is the UNMOUNT. Speech is not part of the
// DOM: a component that starts an utterance and then navigates away keeps talking, out of any view, until the
// text runs out. Nothing in React tears that down, because nothing in React knows about it. This hook cancels its
// own in-flight speech on unmount, which is the single most valuable line in the file.
//
// "ITS OWN" is load-bearing. The platform's cancel is global — one utterance queue per document — so cancelling
// unconditionally on unmount would silence a sibling component that is mid-sentence. The hook counts the
// utterances IT started that have not settled and cancels only when that count is above zero. Two components
// speaking at once still interfere (the platform gives no way not to), but a component that never spoke cannot
// silence one that did.
//
// `supported` rides `useSyncExternalStore` with a subscribe that never fires, the idiom `foundation/screen`'s
// `useFullscreen` uses: `false` during SSR and the real answer on the client, as a re-render rather than a
// hydration mismatch. Nothing subscribes because a browser cannot gain a speech engine mid-session.
//
// `voices` deliberately does NOT ride the store. `getVoices()` returns a FRESH ARRAY on every call, so a
// `getSnapshot` reading it would return a new identity each time and `useSyncExternalStore` would re-render
// forever. It lives in state, seeded by `listVoices` (which waits out the empty-first-call problem) and refreshed
// on `voiceschanged` — Chrome revises the list once remote voices load.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { useLocale } from '../i18n';

import { listVoices, listVoicesSync, onVoicesChanged } from './ListVoices';
import { cancelSpeech, pauseSpeech, resumeSpeech } from './SpeechControls';
import { canSpeak } from './SpeechSupport';
import { speak as speakText, type SpeakOptions } from './Speak';
import type { SpeakResult } from './SpeechResult';

/** What {@link useSpeechSynthesis} returns. */
export interface SpeechSynthesisControls {
  /** Whether this browser can speak. `false` under SSR — render the button only once this is `true`. */
  readonly supported: boolean;

  /** The installed voices. Starts empty and fills in asynchronously; see `ListVoices` for why that is normal. */
  readonly voices: readonly SpeechSynthesisVoice[];

  /** Whether this hook has an utterance in flight. Not the engine's global flag — another component's speech is not this hook's. */
  readonly speaking: boolean;

  /** Whether this hook paused the engine. */
  readonly paused: boolean;

  /** Speaks text, resolving to the outcome. Never throws. Stable across renders. Defaults `lang` to the active locale. */
  readonly speak: (text: string, options?: SpeakOptions) => Promise<SpeakResult>;

  /** Stops all speech in the document — the platform has no narrower cancel. In-flight `speak` calls settle as `cancelled`. */
  readonly cancel: () => void;

  /** Pauses the engine. See `SpeechControls` for Chrome-on-Android's pause-is-cancel behaviour. */
  readonly pause: () => void;

  /** Resumes a paused engine. */
  readonly resume: () => void;
}

/**
 * The initial voice list. Empty rather than `listVoicesSync()`, for the same reason `supported` starts `false`:
 * a server renders nothing and a client would render a full picker, and the mismatch is a hydration error. The
 * mount effect fills it in on the very next tick.
 */
const NoVoices: readonly SpeechSynthesisVoice[] = [];

/** A subscribe that never notifies — speech support cannot change within a session. */
function neverChanges(): () => void {
  return (): void => {
    // Nothing was subscribed, so there is nothing to unsubscribe.
  };
}

/** The SSR snapshot: a server can never speak, and saying otherwise would mismatch the first client render. */
function notSupportedOnServer(): boolean {
  return false;
}

/**
 * Speaks text and owns the lifecycle — cancelling this hook's in-flight speech on unmount.
 *
 * ```tsx
 * const speech = useSpeechSynthesis();
 * <button disabled={!speech.supported} onClick={() => void speech.speak(article)}>
 *   {speech.speaking ? 'Stop' : 'Read aloud'}
 * </button>
 * ```
 *
 * Every callback is stable across renders and inherits the slice's never-throws contract — a rejected promise is
 * not one of the outcomes.
 *
 * @returns The state plus the four controls.
 */
export function useSpeechSynthesis(): SpeechSynthesisControls {
  const { locale } = useLocale();

  const [voices, setVoices] = useState<readonly SpeechSynthesisVoice[]>(NoVoices);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  const supported = useSyncExternalStore(neverChanges, canSpeak, notSupportedOnServer);

  // The locale is read through a ref so `speak` stays identity-stable while still defaulting to the CURRENT
  // locale — the same shape `useMediaStream` uses for its options.
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const mountedRef = useRef(true);

  /** How many utterances THIS hook started and has not seen settle. Drives both `speaking` and the unmount cancel. */
  const inFlightRef = useRef(0);

  const speak = useCallback(async (text: string, options?: SpeakOptions): Promise<SpeakResult> => {
    inFlightRef.current += 1;
    if (mountedRef.current) {
      setSpeaking(true);
      setPaused(false);
    }

    // `lang` falls back to the app's active locale rather than the browser UI language: a localized app should
    // read its own text in the language the user is reading, not the one the OS was installed in.
    const result = await speakText(text, { ...options, lang: options?.lang ?? localeRef.current });

    inFlightRef.current = Math.max(0, inFlightRef.current - 1);
    // Only the LAST utterance clears the flag — a consumer queueing three sentences is speaking until all three
    // have settled.
    if (mountedRef.current && inFlightRef.current === 0) {
      setSpeaking(false);
      setPaused(false);
    }

    return result;
  }, []);

  const cancel = useCallback((): void => {
    cancelSpeech();
    if (mountedRef.current) setPaused(false);
  }, []);

  const pause = useCallback((): void => {
    if (pauseSpeech() && mountedRef.current) setPaused(true);
  }, []);

  const resume = useCallback((): void => {
    if (resumeSpeech() && mountedRef.current) setPaused(false);
  }, []);

  useEffect(() => {
    // Re-armed on mount rather than only at declaration: StrictMode reuses the same ref instance across its
    // double mount, and a stale `false` would freeze every later state update.
    mountedRef.current = true;

    return (): void => {
      mountedRef.current = false;
      // The whole point of the hook. Only when THIS hook has something in flight — the platform's cancel is
      // global, and an unmount is no reason to silence another component.
      if (inFlightRef.current > 0) cancelSpeech();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const apply = (next: readonly SpeechSynthesisVoice[]): void => {
      if (active) setVoices(next);
    };

    // Waits out the empty-first-call problem; resolves immediately once the list is populated.
    void listVoices().then(apply);

    const unsubscribe = onVoicesChanged((): void => {
      apply(listVoicesSync());
    });

    return (): void => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { supported, voices, speaking, paused, speak, cancel, pause, resume };
}
