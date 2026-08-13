// Hand-written types for the Web Speech RECOGNITION half, because TypeScript ships none. `lib.dom.d.ts` carries
// the entire synthesis half (`SpeechSynthesis`, `SpeechSynthesisUtterance`, `SpeechSynthesisVoice`) and NOTHING
// for recognition: the interface never reached a standard, is exposed as `webkitSpeechRecognition` in Chrome and
// Safari, and does not exist in Firefox at all. Without these declarations every recognition call site would be
// an `any` — which the repo bans — or a cast per property read.
//
// Structural, and deliberately NOT extending `Event` / `EventTarget`. The objects a consumer meets at runtime are
// the browser's own and satisfy far more than is named here; the objects a TEST meets are plain literals handed
// straight to a handler. Requiring a real `Event` would force `dispatchEvent` ceremony into every test and buy no
// safety, since only `error`, `results`, and `resultIndex` are ever read.
//
// The shapes are the intersection of what Chrome and Safari actually implement AND what this slice actually
// touches — not the full historical draft (`grammars`, `serviceURI`, `onaudiostart`, `onsoundend`, …), most of
// which no engine implements consistently and no consumer here needs. Everything is typed as the platform
// behaves, not as the draft promises: handlers are nullable properties (assignment is how every engine wires
// them) rather than `addEventListener` overloads.

/** One candidate transcription of a recognized phrase. `maxAlternatives` decides how many a result carries. */
export interface SpeechRecognitionAlternativeLike {
  /** The recognized text. May be empty for a result the engine could not resolve. */
  readonly transcript: string;

  /** The engine's `0`–`1` confidence. Chrome reports `0` for interim results; treat it as a hint, never a gate. */
  readonly confidence: number;
}

/**
 * One phrase's worth of recognition — an array-like of alternatives, best first. Indexing is checked
 * (`noUncheckedIndexedAccess`), so `result[0]` is `… | undefined` and every read here is guarded.
 */
export interface SpeechRecognitionResultLike {
  /** `true` once the engine has committed to this phrase; `false` while it is still revising it. */
  readonly isFinal: boolean;

  /** How many alternatives this result carries. */
  readonly length: number;

  /** The alternatives, best first. */
  readonly [index: number]: SpeechRecognitionAlternativeLike;
}

/** The growing array-like of results a session has produced. Not reset between events — see `resultIndex`. */
export interface SpeechRecognitionResultListLike {
  /** How many results the session has produced so far. */
  readonly length: number;

  /** The results, oldest first. */
  readonly [index: number]: SpeechRecognitionResultLike;
}

/** The `result` event. The results list is cumulative, so `resultIndex` is what makes an update readable. */
export interface SpeechRecognitionEventLike {
  /** Index of the first result CHANGED by this event. Everything before it was already delivered. */
  readonly resultIndex: number;

  /** Every result of the session so far, including ones delivered by earlier events. */
  readonly results: SpeechRecognitionResultListLike;
}

/** The `error` event. `error` is the code the status table maps; `message` is engine-authored and often empty. */
export interface SpeechRecognitionErrorEventLike {
  /** The error code — `not-allowed`, `no-speech`, `audio-capture`, `network`, `aborted`, … */
  readonly error: string;

  /** An engine-authored detail string. Absent or empty in Chrome for most codes. */
  readonly message?: string;
}

/** The recognition instance itself — the members this slice sets, calls, or listens to, and nothing else. */
export interface SpeechRecognitionLike {
  /** BCP-47 language tag to transcribe. Same vocabulary as `foundation/i18n`'s locale. */
  lang: string;

  /** When `true` the session keeps listening past the first phrase. Chrome still ends it on a long silence. */
  continuous: boolean;

  /** When `true` the engine emits revisable partial results before committing to a phrase. */
  interimResults: boolean;

  /** How many alternatives each result should carry. */
  maxAlternatives: number;

  /** Fired for every interim revision and every committed phrase. */
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;

  /** Fired for a denial, a missing microphone, a network failure, an abort, or silence. */
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;

  /** Fired once the engine is actually listening — always later than the `start()` call that asked for it. */
  onstart: (() => void) | null;

  /** Fired when the session ends, for ANY reason: `stop`, `abort`, an error, or the engine's own silence timeout. */
  onend: (() => void) | null;

  /** Begins a session. Throws `InvalidStateError` if one is already running — every call here is guarded. */
  start(): void;

  /** Ends the session, delivering whatever the engine has already recognized. */
  stop(): void;

  /** Ends the session immediately, discarding pending results. */
  abort(): void;
}

/** The `SpeechRecognition` / `webkitSpeechRecognition` constructor, as read off the global scope. */
export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
