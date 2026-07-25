// speech — foundation seam. The Web Speech vector, in two halves that share a name and almost nothing else:
// SYNTHESIS (`speak`, `cancelSpeech` / `pauseSpeech` / `resumeSpeech` / `isSpeaking`, `listVoices`,
// `useSpeechSynthesis`) and RECOGNITION (`createSpeechRecognizer`, `useSpeechRecognition`). No components — a
// read-aloud button is a consumer of these rules, not their owner; React appears only in the two `Use*` files.
//
// DEFINING CONTRACT: NOTHING HERE THROWS. Every entry point is called from a click handler or an effect and
// answers with a value — a boolean, a list, or a discriminated result — instead of throwing or rejecting. `speak`
// never rejects; a recognizer's `start()` returns `already-started` where the platform would throw
// `InvalidStateError`. `unsupported`, `denied`, `cancelled`, and `no-speech` are first-class statuses rather than
// errors: none of them is anybody's bug.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SUPPORT, HONESTLY. The two halves are NOT equally real, and a consumer must be able to detect and degrade.
//
// Synthesis is a standard and is everywhere — Chrome, Safari, Firefox, Edge, mobile. Ship it as a feature; still
// check `supported` for SSR and stripped webviews.
//
// Recognition is NOT a standard. It is a 2012 draft that never advanced:
//  - FIREFOX DOES NOT IMPLEMENT IT AT ALL. There is no flag and no polyfill short of streaming audio to a service
//    yourself. `canRecognizeSpeech()` returns `false` there and every entry point answers `unsupported`.
//  - It is exposed as `webkitSpeechRecognition` in Chrome and Safari; the unprefixed name is newer Chrome only.
//  - IN CHROME, RECOGNITION IS NOT ON-DEVICE. Audio is uploaded to a Google server and the transcript comes back,
//    which is a privacy fact to state in your own UI, a network dependency (`network` status offline), and a
//    quota you do not control. Safari differs; neither guarantees local processing.
//  - Chrome ends a `continuous` session on silence anyway, and this slice deliberately does not auto-restart —
//    see `CreateSpeechRecognizer.ts` for why that loop is a trap.
//
// So: gate recognition UI on `supported` and always leave the typed input in place. `getSpeechSupport()` returns
// both answers at once precisely because no browser guarantees both.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
//
// THE ONE BUG THIS SLICE EXISTS TO ABSORB, if you read nothing else: `speechSynthesis.getVoices()` RETURNS AN
// EMPTY ARRAY ON FIRST CALL. Voices load asynchronously and announce themselves with a `voiceschanged` event, so
// a picker rendered from a synchronous `getVoices()` on mount stays empty forever. `listVoices()` waits for the
// list — through an event that can itself fire empty, and with a timeout for engines that never fire it at all.
// Details, and the two other silent traps (utterance garbage collection, out-of-range prosody), in `ListVoices.ts`
// and `Speak.ts`.
//
// Scope boundary: microphone ACQUISITION and permission stay in `foundation/media` (`requestMicrophoneStream`,
// `getMicrophonePermission`). Recognition opens its own audio device and cannot be handed a `MediaStream`, so the
// two slices do not compose — but the FAILURE VOCABULARY is shared on purpose (`denied` · `unavailable` ·
// `unsupported` · `failed`), so a consumer writes one permission-denied message for both.

export { canSpeak, canRecognizeSpeech, getSpeechSupport, type SpeechSupport } from './SpeechSupport';

export { type SpeakResult, type SpeakStatus } from './SpeechResult';

export { speak, type SpeakOptions, type SpeechHandle } from './Speak';

export { cancelSpeech, pauseSpeech, resumeSpeech, isSpeaking, isSpeechPaused } from './SpeechControls';

export {
  listVoices,
  listVoicesSync,
  findVoice,
  voicesForLang,
  DefaultVoicesTimeoutMs,
  type ListVoicesOptions,
} from './ListVoices';

export {
  useSpeechSynthesis,
  type SpeechSynthesisControls,
} from './UseSpeechSynthesis';

export {
  type SpeechRecognitionStatus,
  type SpeechRecognitionFailure,
  type SpeechTranscript,
} from './SpeechRecognitionResult';

export {
  createSpeechRecognizer,
  type SpeechRecognizer,
  type SpeechRecognizerOptions,
  type RecognizerStartResult,
} from './CreateSpeechRecognizer';

export {
  useSpeechRecognition,
  type SpeechRecognitionControls,
  type UseSpeechRecognitionOptions,
} from './UseSpeechRecognition';

export type {
  SpeechRecognitionLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionResultLike,
  SpeechRecognitionResultListLike,
  SpeechRecognitionAlternativeLike,
  SpeechRecognitionConstructor,
} from './SpeechRecognitionTypes';
