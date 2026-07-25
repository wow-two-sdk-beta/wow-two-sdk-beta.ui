import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMediaStream, type MediaStreamResult } from '@src/foundation/media';

// Browser project — `useMediaStream` needs a real renderer, so the pure-logic cases (the `DOMException` table,
// device grouping, `stopMediaStream`) stay in `media.test.ts` and this file covers only what a renderer adds:
// the pending edge, the result landing in state, and the three release paths.
//
// Headless chromium HAS a real `navigator.mediaDevices` (localhost is a secure context) but no camera and no
// permission, so every test shadows the whole object with an own data property and `afterEach` deletes it —
// restoring the native prototype getter. Shadowing `mediaDevices` rather than just `getUserMedia` also lets a
// test remove the API entirely to exercise the `unsupported` arm.
//
// The tracks are `vi.fn()`-backed fakes rather than real `MediaStreamTrack`s: the assertion that matters is that
// `stop()` reached EVERY track, and a real track from a camera-less harness cannot be obtained at all.

/** A track whose `stop` is observable. */
function fakeTrack(): { track: MediaStreamTrack; stop: ReturnType<typeof vi.fn> } {
  const stop = vi.fn();
  return { track: { stop } as unknown as MediaStreamTrack, stop };
}

/** A stream that is nothing but its track list. */
function fakeStream(tracks: readonly MediaStreamTrack[]): MediaStream {
  return { getTracks: (): MediaStreamTrack[] => [...tracks] } as unknown as MediaStream;
}

/** A promise plus its settle handles — lets a test observe the in-flight state before the prompt "answers". */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Shadows `navigator.mediaDevices` with a stub carrying only `getUserMedia`. */
function stubMediaDevices(getUserMedia: () => Promise<unknown>): void {
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
}

/** Shadows `navigator.mediaDevices` with nothing at all — the unsupported / insecure-page shape. */
function removeMediaDevices(): void {
  Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
}

/** Hands back the queued streams in order, so a test can tell the first acquisition from the second. */
function queueStreams(...streams: readonly MediaStream[]): () => Promise<MediaStream> {
  const queue = [...streams];
  return () => Promise.resolve(queue.shift() ?? fakeStream([]));
}

afterEach(() => {
  // Deleting the own property restores chromium's native `MediaDevices` getter; a leaked stub would leave the
  // next test talking to the previous test's camera.
  delete (navigator as { mediaDevices?: unknown }).mediaDevices;
});

describe('useMediaStream', () => {
  it('starts idle with no stream and no error', () => {
    const { result } = renderHook(() => useMediaStream());

    expect(result.current.status).toBe('idle');
    expect(result.current.stream).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('flips to pending while the prompt is open, then to granted carrying the stream', async () => {
    const gate = deferred<MediaStream>();
    const stream = fakeStream([fakeTrack().track]);
    stubMediaDevices(() => gate.promise);

    const { result } = renderHook(() => useMediaStream());

    let pending!: Promise<MediaStreamResult>;
    act(() => {
      pending = result.current.start();
    });
    expect(result.current.status).toBe('pending');
    expect(result.current.stream).toBeNull();

    await act(async () => {
      gate.resolve(stream);
      await pending;
    });

    expect(result.current.status).toBe('granted');
    expect(result.current.stream).toBe(stream);
    expect(result.current.error).toBeNull();
  });

  it('reports a denial as a status rather than throwing, leaving no stream', async () => {
    stubMediaDevices(() => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')));

    const { result } = renderHook(() => useMediaStream());

    let outcome!: MediaStreamResult;
    await act(async () => {
      outcome = await result.current.start();
    });

    expect(outcome).toEqual({ status: 'denied' });
    expect(result.current.status).toBe('denied');
    expect(result.current.stream).toBeNull();
    // `denied` is a decision, not a failure — nothing for a consumer to report as an error.
    expect(result.current.error).toBeNull();
  });

  it('surfaces the normalized error on a failed attempt', async () => {
    stubMediaDevices(() => Promise.reject(new DOMException('over-constrained', 'OverconstrainedError')));

    const { result } = renderHook(() => useMediaStream());
    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('failed');
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('answers unsupported when the API is absent, without a renderer error', async () => {
    removeMediaDevices();

    const { result } = renderHook(() => useMediaStream());
    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('unsupported');
    expect(result.current.stream).toBeNull();
  });

  it('stop() stops every track and returns to idle', async () => {
    const camera = fakeTrack();
    const microphone = fakeTrack();
    stubMediaDevices(() => Promise.resolve(fakeStream([camera.track, microphone.track])));

    const { result } = renderHook(() => useMediaStream({ constraints: { video: true, audio: true } }));
    await act(async () => {
      await result.current.start();
    });
    expect(camera.stop).not.toHaveBeenCalled();

    act(() => {
      result.current.stop();
    });

    expect(camera.stop).toHaveBeenCalledTimes(1);
    expect(microphone.stop).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('idle');
    expect(result.current.stream).toBeNull();
  });

  it('stops EVERY track on unmount — the camera light must not survive the component', async () => {
    const camera = fakeTrack();
    const microphone = fakeTrack();
    stubMediaDevices(() => Promise.resolve(fakeStream([camera.track, microphone.track])));

    const { result, unmount } = renderHook(() => useMediaStream());
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe('granted');
    expect(camera.stop).not.toHaveBeenCalled();

    unmount();

    expect(camera.stop).toHaveBeenCalledTimes(1);
    expect(microphone.stop).toHaveBeenCalledTimes(1);
  });

  it('releases a stream that arrives AFTER unmount — the late Allow press', async () => {
    const gate = deferred<MediaStream>();
    const track = fakeTrack();
    stubMediaDevices(() => gate.promise);

    const { result, unmount } = renderHook(() => useMediaStream());

    let pending!: Promise<MediaStreamResult>;
    act(() => {
      pending = result.current.start();
    });
    expect(result.current.status).toBe('pending');

    // The component goes away while the browser prompt is still open; the user answers Allow afterwards. No
    // unmount cleanup can reach this stream — it did not exist yet — so `start` itself has to release it.
    unmount();
    gate.resolve(fakeStream([track.track]));
    const outcome = await pending;

    expect(outcome.status).toBe('granted');
    expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it('releases the previous stream before acquiring another — never two live at once', async () => {
    const first = fakeTrack();
    const second = fakeTrack();
    const secondStream = fakeStream([second.track]);
    stubMediaDevices(queueStreams(fakeStream([first.track]), secondStream));

    const { result } = renderHook(() => useMediaStream());
    await act(async () => {
      await result.current.start();
    });
    expect(first.stop).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.start();
    });

    expect(first.stop).toHaveBeenCalledTimes(1);
    expect(second.stop).not.toHaveBeenCalled();
    expect(result.current.stream).toBe(secondStream);
  });

  it('passes per-call constraints over the hook defaults', async () => {
    const seen: MediaStreamConstraints[] = [];
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: (constraints: MediaStreamConstraints) => {
          seen.push(constraints);
          return Promise.resolve(fakeStream([]));
        },
      },
      configurable: true,
    });

    const { result } = renderHook(() => useMediaStream({ constraints: { video: true } }));
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.start({ audio: true });
    });

    expect(seen).toEqual([{ video: true }, { audio: true }]);
  });

  it('keeps start and stop stable across renders', () => {
    const { result, rerender } = renderHook(() => useMediaStream({ constraints: { video: true } }));

    const { start, stop } = result.current;
    rerender();

    expect(result.current.start).toBe(start);
    expect(result.current.stop).toBe(stop);
  });
});
