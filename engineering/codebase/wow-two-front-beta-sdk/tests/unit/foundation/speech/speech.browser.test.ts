import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSpeechRecognition, useSpeechSynthesis, type SpeakResult } from '@src/foundation/speech';

// Browser project — the two hooks need a real renderer, so the pure-logic cases (both status tables, the
// `voiceschanged` wait, the prosody clamp) stay in `speech.test.ts` and this file covers only what a renderer
// adds: state landing from platform events, and the two CLEANUPS that are the reason the hooks exist.
//
// Headless chromium HAS a real `speechSynthesis` (with zero voices) and NO `webkitSpeechRecognition`, so every
// test shadows the globals it needs with own data properties and `afterEach` deletes them — restoring chromium's
// native `speechSynthesis` getter. Shadowing rather than patching also lets a test remove a global entirely to
// exercise the `unsupported` arm, which is the only way to see the Firefox shape in a chromium harness.
//
// The doubles are event-dispatchable classes rather than `vi.fn()` objects: the assertions that matter are
// "unmounting cancelled the utterance" and "unmounting aborted the session", both of which need a fake that
// records platform calls AND lets the test fire the lifecycle events that precede them.

/** Installs a global, shadowing the browser's own. */
function install(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

/** Removes an own property, restoring whatever chromium had on the prototype. */
function remove(name: string): void {
  delete (globalThis as unknown as Record<string, unknown>)[name];
}

/** A spec-minimal `SpeechSynthesisVoice`. */
function fakeVoice(lang: string, name: string): SpeechSynthesisVoice {
  return { lang, name, default: false, localService: true, voiceURI: name } satisfies SpeechSynthesisVoice;
}

/** The utterance double — the handles a test fires to end or fail an utterance. */
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

/** The engine double, counting the calls the unmount assertions turn on. */
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

  emitVoicesChanged(): void {
    for (const listener of [...this.listeners]) listener();
  }

  last(): FakeUtterance {
    const utterance = this.spoken.at(-1);
    if (utterance === undefined) throw new Error('nothing has been spoken');
    return utterance;
  }
}

/** The recognition double. */
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
  }

  stop(): void {
    this.stops += 1;
  }

  abort(): void {
    this.aborts += 1;
  }
}

/** Builds a `result` event in the platform's cumulative array-like shape. */
function resultEvent(transcript: string, isFinal: boolean, resultIndex = 0): unknown {
  return {
    resultIndex,
    results: {
      length: resultIndex + 1,
      [resultIndex]: { isFinal, length: 1, 0: { transcript, confidence: 0.9 } },
    },
  };
}

/** Installs both synthesis globals. */
function installSynthesis(): FakeSynth {
  const synth = new FakeSynth();
  install('speechSynthesis', synth);
  install('SpeechSynthesisUtterance', FakeUtterance);
  return synth;
}

/** Installs the prefixed recognition constructor and clears the instance log. */
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

describe('useSpeechSynthesis', () => {
  it('reports supported and loads the voice list on mount', async () => {
    const synth = installSynthesis();
    synth.voices = [fakeVoice('en-US', 'Samantha')];

    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.supported).toBe(true);

    // The list arrives through `listVoices`, which resolves in a microtask when the engine already has voices.
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.voices).toHaveLength(1);
    expect(result.current.speaking).toBe(false);
  });

  it('refreshes the voices when the engine revises them', async () => {
    const synth = installSynthesis();
    synth.voices = [fakeVoice('en-US', 'Samantha')];

    const { result } = renderHook(() => useSpeechSynthesis());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.voices).toHaveLength(1);

    // Chrome revises the list once remote voices load.
    synth.voices = [fakeVoice('en-US', 'Samantha'), fakeVoice('de-DE', 'Anna')];
    act(() => {
      synth.emitVoicesChanged();
    });

    expect(result.current.voices).toHaveLength(2);
  });

  it('flips speaking while an utterance is in flight and back when it ends', async () => {
    const synth = installSynthesis();
    const { result } = renderHook(() => useSpeechSynthesis());

    let pending!: Promise<SpeakResult>;
    act(() => {
      pending = result.current.speak('hello world');
    });
    expect(result.current.speaking).toBe(true);

    await act(async () => {
      synth.last().onend?.();
      await pending;
    });

    expect(result.current.speaking).toBe(false);
    await expect(pending).resolves.toEqual({ status: 'spoken' });
  });

  it('defaults the utterance language to the active locale', () => {
    const synth = installSynthesis();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speak('hello');
    });

    // No `LocaleProvider` mounted, so `useLocale` falls back to `en-US`.
    expect(synth.last().lang).toBe('en-US');
  });

  it('CANCELS IN-FLIGHT SPEECH ON UNMOUNT — a page that navigates away must not keep talking', () => {
    const synth = installSynthesis();
    const { result, unmount } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speak('a very long article that outlives this component');
    });
    expect(synth.cancels).toBe(0);

    unmount();

    expect(synth.cancels).toBe(1);
  });

  it('does NOT cancel on unmount when it has nothing in flight — the queue is shared', async () => {
    // Cancel is global: a component that never spoke (or whose utterance already ended) must not silence a
    // sibling that is mid-sentence.
    const synth = installSynthesis();
    const { result, unmount } = renderHook(() => useSpeechSynthesis());

    let pending!: Promise<SpeakResult>;
    act(() => {
      pending = result.current.speak('short');
    });
    await act(async () => {
      synth.last().onend?.();
      await pending;
    });

    unmount();

    expect(synth.cancels).toBe(0);
  });

  it('cancel / pause / resume delegate to the engine', () => {
    const synth = installSynthesis();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.pause();
    });
    expect(result.current.paused).toBe(true);

    act(() => {
      result.current.resume();
    });
    expect(result.current.paused).toBe(false);

    act(() => {
      result.current.cancel();
    });
    expect(synth.cancels).toBe(1);
    expect(synth.pauses).toBe(1);
    expect(synth.resumes).toBe(1);
  });

  it('reports unsupported without throwing when the engine is absent', async () => {
    install('speechSynthesis', undefined);
    remove('SpeechSynthesisUtterance');

    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.supported).toBe(false);

    let outcome!: SpeakResult;
    await act(async () => {
      outcome = await result.current.speak('nobody hears this');
    });

    expect(outcome).toEqual({ status: 'unsupported' });
    expect(result.current.speaking).toBe(false);
  });

  it('keeps its callbacks stable across renders', () => {
    installSynthesis();
    const { result, rerender } = renderHook(() => useSpeechSynthesis());

    const { speak, cancel, pause, resume } = result.current;
    rerender();

    expect(result.current.speak).toBe(speak);
    expect(result.current.cancel).toBe(cancel);
    expect(result.current.pause).toBe(pause);
    expect(result.current.resume).toBe(resume);
  });
});

describe('useSpeechRecognition', () => {
  it('starts idle, with no transcript and no error', () => {
    installRecognition();
    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.supported).toBe(true);
    expect(result.current.listening).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.interimTranscript).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('reports listening only once the engine says it is', () => {
    installRecognition();
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      expect(result.current.start()).toEqual({ status: 'started' });
    });
    // Started, but the microphone is not open yet — the gap a two-state flag would misreport.
    expect(result.current.listening).toBe(false);

    act(() => {
      FakeRecognition.latest().onstart?.();
    });
    expect(result.current.listening).toBe(true);
  });

  it('accumulates final phrases and holds interim text separately', () => {
    installRecognition();
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
      FakeRecognition.latest().onstart?.();
    });

    act(() => {
      FakeRecognition.latest().onresult?.(resultEvent('hello wor', false));
    });
    expect(result.current.interimTranscript).toBe('hello wor');
    expect(result.current.transcript).toBe('');

    act(() => {
      FakeRecognition.latest().onresult?.(resultEvent('hello world', true));
    });
    expect(result.current.transcript).toBe('hello world');
    expect(result.current.interimTranscript).toBe('');

    act(() => {
      FakeRecognition.latest().onresult?.(resultEvent('goodbye', true, 1));
    });
    expect(result.current.transcript).toBe('hello world goodbye');
  });

  it('surfaces a classified failure and keeps the transcript', () => {
    installRecognition();
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
      FakeRecognition.latest().onstart?.();
      FakeRecognition.latest().onresult?.(resultEvent('kept', true));
    });

    act(() => {
      FakeRecognition.latest().onerror?.({ error: 'not-allowed' });
      FakeRecognition.latest().onend?.();
    });

    expect(result.current.error?.status).toBe('denied');
    expect(result.current.listening).toBe(false);
    expect(result.current.transcript).toBe('kept');
  });

  it('reset clears the transcript and the error', () => {
    installRecognition();
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
      FakeRecognition.latest().onstart?.();
      FakeRecognition.latest().onresult?.(resultEvent('something', true));
      FakeRecognition.latest().onerror?.({ error: 'no-speech' });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.transcript).toBe('');
    expect(result.current.interimTranscript).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('ABORTS THE SESSION ON UNMOUNT — the microphone must not outlive the component', () => {
    installRecognition();
    const { result, unmount } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
      FakeRecognition.latest().onstart?.();
    });
    const instance = FakeRecognition.latest();
    expect(instance.aborts).toBe(0);

    unmount();

    // `abort`, not `stop`: nothing is left to receive a final transcript.
    expect(instance.aborts).toBe(1);
    expect(instance.stops).toBe(0);
  });

  it('constructs nothing for a component that never starts a session', () => {
    installRecognition();
    const { unmount } = renderHook(() => useSpeechRecognition());

    unmount();

    expect(FakeRecognition.instances).toHaveLength(0);
  });

  it('rebuilds the recognizer when the language changes, aborting the running session', () => {
    installRecognition();
    const { result, rerender } = renderHook(({ lang }: { lang: string }) => useSpeechRecognition({ lang }), {
      initialProps: { lang: 'en-US' },
    });

    act(() => {
      result.current.start();
      FakeRecognition.latest().onstart?.();
    });
    const first = FakeRecognition.latest();
    expect(first.lang).toBe('en-US');

    rerender({ lang: 'de-DE' });
    expect(first.aborts).toBe(1);

    act(() => {
      result.current.start();
    });
    const second = FakeRecognition.latest();
    expect(second).not.toBe(first);
    expect(second.lang).toBe('de-DE');
  });

  it('defaults the recognition language to the active locale', () => {
    installRecognition();
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });

    expect(FakeRecognition.latest().lang).toBe('en-US');
  });

  it('forwards consumer callbacks alongside its own state updates', () => {
    installRecognition();
    const onFinal = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onFinal }));

    act(() => {
      result.current.start();
      FakeRecognition.latest().onresult?.(resultEvent('forwarded', true));
    });

    expect(onFinal).toHaveBeenCalledWith('forwarded');
    expect(result.current.transcript).toBe('forwarded');
  });

  it('reports unsupported without throwing where recognition does not exist — the Firefox shape', () => {
    remove('webkitSpeechRecognition');
    remove('SpeechRecognition');

    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.supported).toBe(false);

    let outcome: unknown;
    act(() => {
      outcome = result.current.start();
    });

    expect(outcome).toEqual({ status: 'unsupported' });
    expect(result.current.listening).toBe(false);
    expect(() => {
      result.current.stop();
      result.current.abort();
    }).not.toThrow();
  });

  it('keeps its callbacks stable across renders', () => {
    installRecognition();
    const { result, rerender } = renderHook(() => useSpeechRecognition());

    const { start, stop, abort, reset } = result.current;
    rerender();

    expect(result.current.start).toBe(start);
    expect(result.current.stop).toBe(stop);
    expect(result.current.abort).toBe(abort);
    expect(result.current.reset).toBe(reset);
  });
});
