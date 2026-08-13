// The Vue binding of the synthesis half — and the reason it exists is the TEARDOWN. Speech is not part of the
// DOM: a component that starts an utterance and then navigates away keeps talking, out of any view, until the
// text runs out. Nothing in Vue tears that down, because nothing in Vue knows about it. This composable cancels
// its own in-flight speech in `onScopeDispose`, which is the single most valuable line in the file.
//
// "ITS OWN" is load-bearing. The platform's cancel is global — one utterance queue per document — so cancelling
// unconditionally on teardown would silence a sibling component that is mid-sentence. The composable counts the
// utterances IT started that have not settled and cancels only when that count is above zero. Two components
// speaking at once still interfere (the platform gives no way not to), but a component that never spoke cannot
// silence one that did.
//
// `supported` is a `shallowRef` seeded `false` and synced in `onMounted`, the idiom `foundation/hooks`'
// `useMediaQuery` uses and the Vue counterpart of the original's `useSyncExternalStore`: `false` during SSR and
// the real answer once mounted, as an update rather than a hydration mismatch. Nothing subscribes because a
// browser cannot gain a speech engine mid-session — and `canSpeak` reads `window`, so it must not run at setup.
//
// `voices` is likewise filled after mount. `getVoices()` returns a FRESH ARRAY on every call, so re-reading it
// as a derived value would produce a new identity each time; it lives in a `shallowRef`, seeded by `listVoices`
// (which waits out the empty-first-call problem) and refreshed on `voiceschanged` — Chrome revises the list once
// remote voices load.

import { onMounted, onScopeDispose, shallowRef, type ShallowRef } from 'vue';

import { useLocale } from '../i18n';

import { listVoices, listVoicesSync, onVoicesChanged } from './ListVoices';
import { speak as speakText, type SpeakOptions } from './Speak';
import { cancelSpeech, pauseSpeech, resumeSpeech } from './SpeechControls';
import type { SpeakResult } from './SpeechResult';
import { canSpeak } from './SpeechSupport';

/** What {@link useSpeechSynthesis} returns. */
export interface SpeechSynthesisControls {
  /** Whether this browser can speak. `false` under SSR — render the button only once this is `true`. */
  readonly supported: Readonly<ShallowRef<boolean>>;

  /** The installed voices. Starts empty and fills in asynchronously; see `ListVoices` for why that is normal. */
  readonly voices: Readonly<ShallowRef<readonly SpeechSynthesisVoice[]>>;

  /** Whether this composable has an utterance in flight. Not the engine's global flag — another component's speech is not this one's. */
  readonly speaking: Readonly<ShallowRef<boolean>>;

  /** Whether this composable paused the engine. */
  readonly paused: Readonly<ShallowRef<boolean>>;

  /** Speaks text, resolving to the outcome. Never throws. Defaults `lang` to the active locale. */
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
 * a server renders nothing and a client would render a full picker, and the mismatch is a hydration error —
 * quite apart from `listVoicesSync` reaching for a global the server does not have. The mount hook fills it in
 * on the very next tick.
 */
const NoVoices: readonly SpeechSynthesisVoice[] = [];

/**
 * Speaks text and owns the lifecycle — cancelling this composable's in-flight speech when the scope is disposed.
 *
 * ```vue
 * const speech = useSpeechSynthesis();
 * <button :disabled="!speech.supported.value" @click="speech.speak(article)">
 *   {{ speech.speaking.value ? 'Stop' : 'Read aloud' }}
 * </button>
 * ```
 *
 * Inherits the slice's never-throws contract — a rejected promise is not one of the outcomes.
 *
 * @returns The state plus the four controls.
 */
export function useSpeechSynthesis(): SpeechSynthesisControls {
  const { locale } = useLocale();

  const voices = shallowRef<readonly SpeechSynthesisVoice[]>(NoVoices);
  const speaking = shallowRef(false);
  const paused = shallowRef(false);
  const supported = shallowRef(false);

  /** Guards state writes after teardown. */
  let disposed = false;

  /** How many utterances THIS composable started and has not seen settle. Drives both `speaking` and the cancel. */
  let inFlight = 0;

  const speak = async (text: string, options?: SpeakOptions): Promise<SpeakResult> => {
    inFlight += 1;
    if (!disposed) {
      speaking.value = true;
      paused.value = false;
    }

    // `lang` falls back to the app's active locale rather than the browser UI language: a localized app should
    // read its own text in the language the user is reading, not the one the OS was installed in.
    const result = await speakText(text, { ...options, lang: options?.lang ?? locale.value });

    inFlight = Math.max(0, inFlight - 1);
    // Only the LAST utterance clears the flag — a consumer queueing three sentences is speaking until all three
    // have settled.
    if (!disposed && inFlight === 0) {
      speaking.value = false;
      paused.value = false;
    }

    return result;
  };

  const cancel = (): void => {
    cancelSpeech();
    if (!disposed) paused.value = false;
  };

  const pause = (): void => {
    if (pauseSpeech() && !disposed) paused.value = true;
  };

  const resume = (): void => {
    if (resumeSpeech() && !disposed) paused.value = false;
  };

  let unsubscribe: (() => void) | undefined;

  onMounted(() => {
    supported.value = canSpeak();

    const apply = (next: readonly SpeechSynthesisVoice[]): void => {
      if (!disposed) voices.value = next;
    };

    // Waits out the empty-first-call problem; resolves immediately once the list is populated.
    void listVoices().then(apply);

    unsubscribe = onVoicesChanged((): void => {
      apply(listVoicesSync());
    });
  });

  onScopeDispose(() => {
    disposed = true;
    unsubscribe?.();
    unsubscribe = undefined;
    // The whole point of the composable. Only when THIS one has something in flight — the platform's cancel is
    // global, and a teardown is no reason to silence another component.
    if (inFlight > 0) cancelSpeech();
  });

  return { supported, voices, speaking, paused, speak, cancel, pause, resume };
}
