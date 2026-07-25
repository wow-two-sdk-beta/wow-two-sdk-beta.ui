import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  canRecognizeSpeech,
  canSpeak,
  cancelSpeech,
  createSpeechRecognizer,
  findVoice,
  getSpeechSupport,
  isSpeaking,
  isSpeechPaused,
  listVoices,
  listVoicesSync,
  pauseSpeech,
  resumeSpeech,
  speak,
  voicesForLang,
  type SpeechRecognitionFailure,
  type SpeechTranscript,
} from '@src/foundation/speech';

// Node project — everything outside the two hooks is capability detection, event plumbing, and two code→status
// tables, so fake globals are all it needs; no DOM, no renderer. Node has no `speechSynthesis`, no
// `SpeechSynthesisUtterance`, and no `webkitSpeechRecognition`, which is exactly the SSR / Firefox shape — so the
// unsupported assertions are real by default and each test installs only the globals its case needs. `afterEach`
// removes all three: a leaked stub would silently turn the SSR assertions green.
//
// The fakes are hand-written classes rather than `vi.fn()` objects because the API is EVENT-DRIVEN — the
// assertions that matter are "the promise settled when `end` fired" and "the wait survived an empty
// `voiceschanged`", which need a double a test can dispatch from, not one it can only inspect.
//
// `useSpeechSynthesis` / `useSpeechRecognition` need a renderer and live in `speech.browser.test.ts`.

/** Installs a global, shadowing anything already there. */
function install(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

/** Removes a global — restoring the "this environment cannot speak" shape Node starts in. */
function remove(name: string): void {
  delete (globalThis as unknown as Record<string, unknown>)[name];
}

/** Resolves after a macrotask, so a test can prove a promise has NOT settled yet. */
function tick(): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

/** A spec-minimal `SpeechSynthesisVoice`. */
function fakeVoice(lang: string, name: string, isDefault = false): SpeechSynthesisVoice {
  return { lang, name, default: isDefault, localService: true, voiceURI: name } satisfies SpeechSynthesisVoice;
}

/** The utterance double: records what was assigned, and lets a test fire the lifecycle events. */
class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onstart: (() => void) | null = null;

  constructor(text?: string) {
    this.text = text ?? '';
  }
}

/** The engine double: an utterance log, call counters, and a dispatchable `voiceschanged`. */
class FakeSynth {
  speaking = false;
  paused = false;
  pending = false;
  voices: SpeechSynthesisVoice[] = [];
  readonly spoken: FakeUtterance[] = [];
  cancels = 0;
  pauses = 0;
  resumes = 0;

  private readonly listeners = new Set<() => void>();

  speak(utterance: FakeUtterance): void {
    this.spoken.push(utterance);
    this.speaking = true;
  }

  cancel(): void {
    this.cancels += 1;
    this.speaking = false;
  }

  pause(): void {
    this.pauses += 1;
    this.paused = true;
  }

  resume(): void {
    this.resumes += 1;
    this.paused = false;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  addEventListener(type: string, listener: () => void): void {
    if (type === 'voiceschanged') this.listeners.add(listener);
  }

  removeEventListener(type: string, listener: () => void): void {
    if (type === 'voiceschanged') this.listeners.delete(listener);
  }

  /** Fires the event the platform uses to announce a populated voice list. */
  emitVoicesChanged(): void {
    for (const listener of [...this.listeners]) listener();
  }

  /** How many listeners are still attached — the leak check after a `listVoices` settles. */
  get listenerCount(): number {
    return this.listeners.size;
  }

  /** The utterance most recently handed to `speak`. */
  last(): FakeUtterance {
    const utterance = this.spoken.at(-1);
    if (utterance === undefined) throw new Error('nothing has been spoken');
    return utterance;
  }
}

/** The recognition double. Instances are collected so a test can reach the one the factory built. */
class FakeRecognition {
  static instances: FakeRecognition[] = [];

  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;

  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;

  starts = 0;
  stops = 0;
  aborts = 0;
  startThrows = false;

  constructor() {
    FakeRecognition.instances.push(this);
  }

  static latest(): FakeRecognition {
    const instance = FakeRecognition.instances.at(-1);
    if (instance === undefined) throw new Error('no recognizer was constructed');
    return instance;
  }

  start(): void {
    this.starts += 1;
    if (this.startThrows) throw new Error('InvalidStateError: recognition has already started');
  }

  stop(): void {
    this.stops += 1;
  }

  abort(): void {
    this.aborts += 1;
  }
}

/** Installs both synthesis globals — the engine and the utterance constructor fail independently. */
function installSynthesis(synth: FakeSynth = new FakeSynth()): FakeSynth {
  install('speechSynthesis', synth);
  install('SpeechSynthesisUtterance', FakeUtterance);
  return synth;
}

/** Installs the prefixed recognition constructor — the Chrome / Safari shape. */
function installRecognition(): void {
  FakeRecognition.instances = [];
  install('webkitSpeechRecognition', FakeRecognition);
}

afterEach(() => {
  remove('speechSynthesis');
  remove('SpeechSynthesisUtterance');
  remove('webkitSpeechRecognition');
  remove('SpeechRecognition');
  FakeRecognition.instances = [];
});

describe('support detection', () => {
  it('reports both halves absent under SSR', () => {
    expect(getSpeechSupport()).toEqual({ synthesis: false, recognition: false });
    expect(canSpeak()).toBe(false);
    expect(canRecognizeSpeech()).toBe(false);
  });

  it('reports the two halves INDEPENDENTLY — the Firefox shape is synthesis without recognition', () => {
    installSynthesis();
    expect(getSpeechSupport()).toEqual({ synthesis: true, recognition: false });
  });

  it('refuses synthesis when the engine is present but SpeechSynthesisUtterance is not', () => {
    // The partial-polyfill shape a naive `'speechSynthesis' in window` check passes, then throws on `new`.
    install('speechSynthesis', new FakeSynth());
    expect(canSpeak()).toBe(false);
  });

  it('finds the unprefixed recognition constructor as well as the webkit one', () => {
    install('SpeechRecognition', FakeRecognition);
    expect(canRecognizeSpeech()).toBe(true);
  });

  it('reads a throwing global getter as absent rather than propagating', () => {
    Object.defineProperty(globalThis, 'speechSynthesis', {
      configurable: true,
      get(): never {
        throw new Error('locked-down webview');
      },
    });

    expect(() => canSpeak()).not.toThrow();
    expect(canSpeak()).toBe(false);
  });
});

describe('synthesis — unsupported / SSR', () => {
  it('speak resolves unsupported instead of throwing', async () => {
    await expect(speak('hello')).resolves.toEqual({ status: 'unsupported' });
  });

  it('every control answers false without touching a global', () => {
    expect(cancelSpeech()).toBe(false);
    expect(pauseSpeech()).toBe(false);
    expect(resumeSpeech()).toBe(false);
    expect(isSpeaking()).toBe(false);
    expect(isSpeechPaused()).toBe(false);
  });

  it('the unsupported handle is inert rather than absent', () => {
    const handle = speak('hello');
    expect(() => {
      handle.cancel();
      handle.pause();
      handle.resume();
    }).not.toThrow();
  });

  it('listVoices resolves empty, listVoicesSync returns empty, findVoice returns undefined', async () => {
    expect(listVoicesSync()).toEqual([]);
    await expect(listVoices()).resolves.toEqual([]);
    await expect(findVoice('en-US')).resolves.toBeUndefined();
  });
});

describe('speak', () => {
  it('resolves `spoken` when the utterance fires end', async () => {
    const synth = installSynthesis();

    const handle = speak('hello world');
    expect(synth.last().text).toBe('hello world');

    synth.last().onend?.();

    await expect(handle).resolves.toEqual({ status: 'spoken' });
  });

  it('exposes the same outcome on `.spoken` as on the handle itself', async () => {
    const synth = installSynthesis();
    const handle = speak('hi');
    synth.last().onend?.();

    await expect(handle.spoken).resolves.toEqual({ status: 'spoken' });
  });

  it('applies voice, lang, and prosody to the utterance', async () => {
    const synth = installSynthesis();
    const voice = fakeVoice('de-DE', 'Anna');

    const handle = speak('Guten Tag', { voice, lang: 'de-DE', rate: 1.2, pitch: 0.8, volume: 0.5 });
    const utterance = synth.last();

    expect(utterance.voice).toBe(voice);
    expect(utterance.lang).toBe('de-DE');
    expect(utterance.rate).toBe(1.2);
    expect(utterance.pitch).toBe(0.8);
    expect(utterance.volume).toBe(0.5);

    utterance.onend?.();
    await handle;
  });

  it('clamps out-of-range prosody instead of letting the setter throw', async () => {
    const synth = installSynthesis();

    const handle = speak('loud', { rate: 99, pitch: -4, volume: 12 });
    const utterance = synth.last();

    expect(utterance.rate).toBe(10);
    expect(utterance.pitch).toBe(0);
    expect(utterance.volume).toBe(1);

    utterance.onend?.();
    await handle;
  });

  it('ignores non-finite prosody, leaving the engine default in place', async () => {
    const synth = installSynthesis();

    const handle = speak('nan', { rate: Number.NaN, pitch: Number.POSITIVE_INFINITY, volume: Number.NaN });
    const utterance = synth.last();

    expect(utterance.rate).toBe(1);
    expect(utterance.pitch).toBe(1);
    expect(utterance.volume).toBe(1);

    utterance.onend?.();
    await handle;
  });

  it('reports `cancelled`, NOT `spoken`, when a cancel precedes the end event', async () => {
    // Chrome ends a cancelled utterance with a plain `end` — indistinguishable from a natural finish without the
    // generation counter. This is the case that would otherwise report success for speech the user cut off.
    const synth = installSynthesis();

    const handle = speak('a long article');
    cancelSpeech();
    synth.last().onend?.();

    await expect(handle).resolves.toEqual({ status: 'cancelled' });
    expect(synth.cancels).toBe(1);
  });

  it('reports `cancelled` for the platform cancellation codes', async () => {
    for (const code of ['canceled', 'interrupted']) {
      const synth = installSynthesis();

      const handle = speak('interrupt me');
      synth.last().onerror?.({ error: code });

      await expect(handle).resolves.toEqual({ status: 'cancelled' });
    }
  });

  it('reports `failed` with the code in the error for a genuine engine failure', async () => {
    const synth = installSynthesis();

    const handle = speak('unspeakable');
    synth.last().onerror?.({ error: 'synthesis-failed' });

    const result = await handle;
    expect(result.status).toBe('failed');
    if (result.status === 'failed') expect(result.error.message).toContain('synthesis-failed');
  });

  it('reports `failed` when the engine throws on speak', async () => {
    const synth = installSynthesis();
    vi.spyOn(synth, 'speak').mockImplementation(() => {
      throw new Error('engine refused');
    });

    const result = await speak('nope');
    expect(result.status).toBe('failed');
    if (result.status === 'failed') expect(result.error.message).toBe('engine refused');
  });

  it('reports `failed` — not `unsupported` — when the utterance constructor throws', async () => {
    install('speechSynthesis', new FakeSynth());
    install('SpeechSynthesisUtterance', function ThrowingUtterance(): never {
      throw new Error('constructor refused');
    });

    const result = await speak('hello');
    expect(result.status).toBe('failed');
  });

  it('settles exactly once — a trailing error after end cannot rewrite the outcome', async () => {
    const synth = installSynthesis();

    const handle = speak('twice');
    synth.last().onend?.();
    synth.last().onerror?.({ error: 'synthesis-failed' });

    await expect(handle).resolves.toEqual({ status: 'spoken' });
  });

  it('handle.cancel() stops the engine and settles the handle as cancelled', async () => {
    const synth = installSynthesis();

    const handle = speak('stop me');
    handle.cancel();
    synth.last().onend?.();

    expect(synth.cancels).toBe(1);
    await expect(handle).resolves.toEqual({ status: 'cancelled' });
  });

  it('handle.pause() / resume() delegate to the engine', async () => {
    const synth = installSynthesis();

    const handle = speak('pause me');
    handle.pause();
    handle.resume();

    expect(synth.pauses).toBe(1);
    expect(synth.resumes).toBe(1);

    synth.last().onend?.();
    await handle;
  });
});

describe('queue controls', () => {
  it('delegate to the engine and report that they reached it', () => {
    const synth = installSynthesis();

    expect(pauseSpeech()).toBe(true);
    expect(isSpeechPaused()).toBe(true);
    expect(resumeSpeech()).toBe(true);
    expect(isSpeechPaused()).toBe(false);
    expect(cancelSpeech()).toBe(true);
    expect(synth.cancels).toBe(1);
  });

  it('reads the engine speaking flag rather than a local one', () => {
    const synth = installSynthesis();
    expect(isSpeaking()).toBe(false);

    speak('talking');
    expect(isSpeaking()).toBe(true);

    synth.cancel();
    expect(isSpeaking()).toBe(false);
  });

  it('reports false when a control throws, without propagating', () => {
    const synth = installSynthesis();
    vi.spyOn(synth, 'cancel').mockImplementation(() => {
      throw new Error('engine refused');
    });

    expect(() => cancelSpeech()).not.toThrow();
    expect(cancelSpeech()).toBe(false);
  });
});

describe('listVoices — the asynchronously-populated voice list', () => {
  it('resolves immediately when the engine already has voices', async () => {
    const synth = installSynthesis();
    synth.voices = [fakeVoice('en-US', 'Samantha')];

    await expect(listVoices()).resolves.toHaveLength(1);
    expect(synth.listenerCount).toBe(0);
  });

  it('WAITS for voiceschanged when the first getVoices() is empty — the empty-picker bug', async () => {
    const synth = installSynthesis();

    let settled: readonly SpeechSynthesisVoice[] | undefined;
    const pending = listVoices({ timeoutMs: 5000 }).then((voices) => {
      settled = voices;
      return voices;
    });

    // A whole macrotask passes with the list still empty. A naive implementation has already resolved with `[]`.
    await tick();
    expect(settled).toBeUndefined();
    expect(synth.listenerCount).toBe(1);

    synth.voices = [fakeVoice('en-US', 'Samantha'), fakeVoice('de-DE', 'Anna')];
    synth.emitVoicesChanged();

    await expect(pending).resolves.toHaveLength(2);
    // The listener is gone: the wait is over, and nothing is left holding the engine.
    expect(synth.listenerCount).toBe(0);
  });

  it('ignores a voiceschanged that still carries an empty list, then resolves on the real one', async () => {
    // Chrome fires the event once during initialization, before a single voice is registered.
    const synth = installSynthesis();

    let settled = false;
    const pending = listVoices({ timeoutMs: 5000 }).then((voices) => {
      settled = true;
      return voices;
    });

    synth.emitVoicesChanged();
    await tick();
    expect(settled).toBe(false);

    synth.voices = [fakeVoice('en-GB', 'Daniel')];
    synth.emitVoicesChanged();

    await expect(pending).resolves.toHaveLength(1);
  });

  it('times out to whatever the engine has — a late population with no event still lands', async () => {
    const synth = installSynthesis();
    const pending = listVoices({ timeoutMs: 20 });

    // Populated WITHOUT firing the event: the engine that never announces itself.
    synth.voices = [fakeVoice('fr-FR', 'Amelie')];

    await expect(pending).resolves.toHaveLength(1);
    expect(synth.listenerCount).toBe(0);
  });

  it('times out to an empty list on a device with genuinely no voices', async () => {
    const synth = installSynthesis();

    await expect(listVoices({ timeoutMs: 20 })).resolves.toEqual([]);
    expect(synth.listenerCount).toBe(0);
  });

  it('falls back to the onvoiceschanged property on engines without addEventListener', async () => {
    // Older WebKit exposes the property and nothing else.
    const synth = {
      voices: [] as SpeechSynthesisVoice[],
      onvoiceschanged: null as ((event: Event) => void) | null,
      getVoices(): SpeechSynthesisVoice[] {
        return this.voices;
      },
      speak(): void {
        // Present so `canSpeak` passes; this test never speaks.
      },
    };
    install('speechSynthesis', synth);
    install('SpeechSynthesisUtterance', FakeUtterance);

    const pending = listVoices({ timeoutMs: 5000 });
    expect(typeof synth.onvoiceschanged).toBe('function');

    synth.voices = [fakeVoice('it-IT', 'Alice')];
    synth.onvoiceschanged?.(new Event('voiceschanged'));

    await expect(pending).resolves.toHaveLength(1);
    // The property is restored, not left holding this module's closure.
    expect(synth.onvoiceschanged).toBeNull();
  });

  it('reads a getVoices() that returns a non-array as no voices', () => {
    install('speechSynthesis', {
      getVoices: (): unknown => 'not a list',
      speak: (): void => {
        // Unused by this assertion.
      },
    });

    expect(listVoicesSync()).toEqual([]);
  });
});

describe('voicesForLang / findVoice', () => {
  const voices = [
    fakeVoice('en-US', 'Samantha'),
    fakeVoice('en-GB', 'Daniel'),
    fakeVoice('en-GB', 'Kate', true),
    fakeVoice('de-DE', 'Anna'),
  ];

  it('puts exact tag matches before same-language ones', () => {
    const matched = voicesForLang(voices, 'en-GB').map((voice) => voice.name);
    // Kate is `default`, so she leads her tier; Samantha is en-US — same language, so last.
    expect(matched).toEqual(['Kate', 'Daniel', 'Samantha']);
  });

  it('matches a bare primary subtag against regional voices', () => {
    expect(voicesForLang(voices, 'de').map((voice) => voice.name)).toEqual(['Anna']);
  });

  it('tolerates casing and the underscore separator some engines report', () => {
    expect(voicesForLang(voices, 'EN_gb').map((voice) => voice.name)).toEqual(['Kate', 'Daniel', 'Samantha']);
  });

  it('returns empty for an unmatched language and for an empty tag', () => {
    expect(voicesForLang(voices, 'ja-JP')).toEqual([]);
    expect(voicesForLang(voices, '   ')).toEqual([]);
  });

  it('findVoice picks the best match through the async list', async () => {
    const synth = installSynthesis();
    synth.voices = voices;

    await expect(findVoice('en-GB')).resolves.toBe(voices[2]);
  });
});

describe('recognition — unsupported', () => {
  it('hands back an inert recognizer instead of throwing', () => {
    const recognizer = createSpeechRecognizer();

    expect(recognizer.supported).toBe(false);
    expect(recognizer.listening).toBe(false);
    expect(recognizer.start()).toEqual({ status: 'unsupported' });
    expect(() => {
      recognizer.stop();
      recognizer.abort();
    }).not.toThrow();
  });

  it('reports `failed` with the real error when the constructor exists but refuses', () => {
    install('webkitSpeechRecognition', function Refusing(): never {
      throw new Error('blocked by permissions policy');
    });

    const recognizer = createSpeechRecognizer();
    const result = recognizer.start();

    expect(recognizer.supported).toBe(false);
    expect(result.status).toBe('failed');
    if (result.status === 'failed') expect(result.error.message).toContain('blocked by permissions policy');
  });
});

describe('recognition — session lifecycle', () => {
  it('configures the instance from the options', () => {
    installRecognition();
    createSpeechRecognizer({ lang: 'uz-UZ', continuous: true, interimResults: true, maxAlternatives: 3 });

    const instance = FakeRecognition.latest();
    expect(instance.lang).toBe('uz-UZ');
    expect(instance.continuous).toBe(true);
    expect(instance.interimResults).toBe(true);
    expect(instance.maxAlternatives).toBe(3);
  });

  it('starts, reports listening only once the engine says so, and ends', () => {
    installRecognition();
    const started = vi.fn();
    const ended = vi.fn();
    const recognizer = createSpeechRecognizer({ onStart: started, onEnd: ended });

    expect(recognizer.start()).toEqual({ status: 'started' });
    expect(FakeRecognition.latest().starts).toBe(1);
    // The gap between `start()` and the engine opening the microphone: asked for, not yet listening.
    expect(recognizer.listening).toBe(false);

    FakeRecognition.latest().onstart?.();
    expect(recognizer.listening).toBe(true);
    expect(started).toHaveBeenCalledTimes(1);

    FakeRecognition.latest().onend?.();
    expect(recognizer.listening).toBe(false);
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it('answers already-started rather than letting the native InvalidStateError through', () => {
    installRecognition();
    const recognizer = createSpeechRecognizer();

    recognizer.start();
    // Still in the `starting` window — the exact case a two-state flag would wave through.
    expect(recognizer.start()).toEqual({ status: 'already-started' });
    expect(FakeRecognition.latest().starts).toBe(1);
  });

  it('reports `failed` when the engine itself throws on start', () => {
    installRecognition();
    const recognizer = createSpeechRecognizer();
    FakeRecognition.latest().startThrows = true;

    const result = recognizer.start();
    expect(result.status).toBe('failed');
    // The wrapper did not strand itself: a retry is allowed.
    expect(recognizer.start().status).toBe('failed');
  });

  it('stop and abort reach the engine only while a session exists', () => {
    installRecognition();
    const recognizer = createSpeechRecognizer();

    recognizer.stop();
    recognizer.abort();
    expect(FakeRecognition.latest().stops).toBe(0);
    expect(FakeRecognition.latest().aborts).toBe(0);

    recognizer.start();
    recognizer.stop();
    recognizer.abort();
    expect(FakeRecognition.latest().stops).toBe(1);
    expect(FakeRecognition.latest().aborts).toBe(1);
  });
});

describe('recognition — the error-code table', () => {
  const cases: ReadonlyArray<readonly [string, string]> = [
    ['not-allowed', 'denied'],
    ['service-not-allowed', 'denied'],
    ['audio-capture', 'unavailable'],
    ['no-speech', 'no-speech'],
    ['network', 'network'],
    ['aborted', 'aborted'],
    ['language-not-supported', 'language-unsupported'],
    ['bad-grammar', 'failed'],
    ['something-new', 'failed'],
  ];

  it.each(cases)('maps %s onto %s', (code, status) => {
    installRecognition();
    const failures: SpeechRecognitionFailure[] = [];
    const recognizer = createSpeechRecognizer({ onError: (failure) => failures.push(failure) });
    recognizer.start();

    FakeRecognition.latest().onerror?.({ error: code, message: 'engine detail' });

    expect(failures.at(0)?.status).toBe(status);
    expect(failures.at(0)?.error.message).toContain(code);
    expect(failures.at(0)?.error.message).toContain('engine detail');
  });

  it('falls back to failed for an unreadable event', () => {
    installRecognition();
    const failures: SpeechRecognitionFailure[] = [];
    const recognizer = createSpeechRecognizer({ onError: (failure) => failures.push(failure) });
    recognizer.start();

    FakeRecognition.latest().onerror?.(null);

    expect(failures.at(0)?.status).toBe('failed');
  });
});

describe('recognition — transcripts', () => {
  /** Builds a `result` event in the platform's array-like shape. */
  function resultEvent(
    entries: ReadonlyArray<{ transcript: string; isFinal: boolean; confidence?: number }>,
    resultIndex = 0,
  ): unknown {
    const results: Record<number, unknown> & { length: number } = { length: entries.length };
    entries.forEach((entry, index) => {
      results[index] = {
        isFinal: entry.isFinal,
        length: 1,
        0: { transcript: entry.transcript, confidence: entry.confidence ?? 0.9 },
      };
    });
    return { resultIndex, results };
  }

  it('splits interim from final and reports both to the right callbacks', () => {
    installRecognition();
    const all: SpeechTranscript[] = [];
    const finals: string[] = [];
    const interims: string[] = [];

    const recognizer = createSpeechRecognizer({
      interimResults: true,
      onResult: (result) => all.push(result),
      onFinal: (text) => finals.push(text),
      onInterim: (text) => interims.push(text),
    });
    recognizer.start();

    FakeRecognition.latest().onresult?.(resultEvent([{ transcript: 'hello wor', isFinal: false }]));
    FakeRecognition.latest().onresult?.(resultEvent([{ transcript: 'hello world', isFinal: true }]));

    expect(interims).toEqual(['hello wor']);
    expect(finals).toEqual(['hello world']);
    expect(all).toHaveLength(2);
    expect(all.at(0)).toEqual({ transcript: 'hello wor', isFinal: false, confidence: 0.9 });
  });

  it('starts at resultIndex, so an earlier phrase is not re-emitted', () => {
    installRecognition();
    const finals: string[] = [];
    const recognizer = createSpeechRecognizer({ onFinal: (text) => finals.push(text) });
    recognizer.start();

    // The results list is cumulative; only the second entry is new.
    FakeRecognition.latest().onresult?.(
      resultEvent(
        [
          { transcript: 'already delivered', isFinal: true },
          { transcript: 'brand new', isFinal: true },
        ],
        1,
      ),
    );

    expect(finals).toEqual(['brand new']);
  });

  it('joins several pending interim results into one string', () => {
    installRecognition();
    const interims: string[] = [];
    const recognizer = createSpeechRecognizer({ interimResults: true, onInterim: (text) => interims.push(text) });
    recognizer.start();

    FakeRecognition.latest().onresult?.(
      resultEvent([
        { transcript: 'one', isFinal: false },
        { transcript: 'two', isFinal: false },
      ]),
    );

    expect(interims).toEqual(['one two']);
  });

  it('absorbs a consumer callback that throws, keeping the session alive', () => {
    installRecognition();
    const ended = vi.fn();
    const recognizer = createSpeechRecognizer({
      onFinal: () => {
        throw new Error('consumer blew up');
      },
      onEnd: ended,
    });
    recognizer.start();

    expect(() => FakeRecognition.latest().onresult?.(resultEvent([{ transcript: 'boom', isFinal: true }]))).not.toThrow();

    FakeRecognition.latest().onend?.();
    expect(ended).toHaveBeenCalledTimes(1);
  });
});

describe('hostile input — nothing throws, everything answers', () => {
  it('speak survives a non-string text and a hostile options object', async () => {
    const synth = installSynthesis();

    const hostileOptions = {
      get lang(): string {
        throw new Error('options getter exploded');
      },
      rate: 2,
    };

    const first = speak(null as unknown as string);
    const second = speak('text', hostileOptions as unknown as { rate: number });

    expect(synth.spoken).toHaveLength(2);
    synth.spoken.forEach((utterance) => utterance.onend?.());

    await expect(first).resolves.toEqual({ status: 'spoken' });
    await expect(second).resolves.toEqual({ status: 'spoken' });
  });

  it('speak survives an utterance whose setters throw', async () => {
    const synth = new FakeSynth();
    install('speechSynthesis', synth);
    install(
      'SpeechSynthesisUtterance',
      class HostileUtterance {
        onend: (() => void) | null = null;
        onerror: ((event: unknown) => void) | null = null;
        set lang(_value: string) {
          throw new Error('setter refused');
        }
      },
    );

    const handle = speak('hi', { lang: 'en-US' });
    expect(synth.spoken).toHaveLength(1);

    synth.last().onend?.();
    await expect(handle).resolves.toEqual({ status: 'spoken' });
  });

  it('recognition survives garbage result events', () => {
    installRecognition();
    const results: SpeechTranscript[] = [];
    const recognizer = createSpeechRecognizer({ onResult: (result) => results.push(result) });
    recognizer.start();

    const instance = FakeRecognition.latest();
    const hostile: unknown[] = [
      null,
      undefined,
      {},
      { resultIndex: 0 },
      { resultIndex: -5, results: { length: 1, 0: undefined } },
      { resultIndex: Number.NaN, results: { length: 2 } },
      { resultIndex: 0, results: { length: 1, 0: { isFinal: true, length: 0 } } },
      { resultIndex: 0, results: { length: 1, 0: { isFinal: 'yes', length: 1, 0: { transcript: 42 } } } },
    ];

    for (const event of hostile) {
      expect(() => instance.onresult?.(event)).not.toThrow();
    }

    // The one hostile event that did carry an alternative was normalized rather than dropped.
    expect(results.every((result) => typeof result.transcript === 'string')).toBe(true);
  });

  it('voicesForLang survives voices with unreadable tags', () => {
    const hostile = [
      { lang: 42, name: 'Bad' },
      { lang: '', name: 'Empty' },
      fakeVoice('en-US', 'Good'),
    ] as unknown as SpeechSynthesisVoice[];

    expect(voicesForLang(hostile, 'en').map((voice) => voice.name)).toEqual(['Good']);
  });
});
