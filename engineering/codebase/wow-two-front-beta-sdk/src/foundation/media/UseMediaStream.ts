// The React binding of the capture vector — a state machine over `requestMediaStream` whose real job is OWNING
// the stream, because a component that forgets to release one leaves the camera light on after it is gone.
//
// Three release paths, all of which have to work or the leak is back:
//  1. `stop()` — the explicit one.
//  2. Unmount — the cleanup effect. The common case: the user navigates away with the preview open.
//  3. Unmount WHILE A PROMPT IS OPEN — the one that is always missed. The user presses Allow after the component
//     has gone; the promise resolves with a live stream nobody will ever render, and no unmount cleanup can
//     reach it because it did not exist when the cleanup ran. `start` therefore re-checks mounted-ness after the
//     await and releases the arriving stream itself.
//
// The live stream is held in a ref as well as state. The cleanup effect must reach the CURRENT stream, and an
// effect closing over the state value would either tear down a stale one or need the stream in its dependency
// array — which would re-run (and so tear down) on every successful acquisition.
//
// Acquisition is on demand — no `autoStart`. Under StrictMode an effect-driven acquisition mounts, prompts,
// tears down, and prompts again; and a permission prompt fired without a user gesture is both a worse experience
// and rate-limited by browsers. A click calls `start`.
//
// Never throws: `start` inherits the module's contract and resolves to the result as well as reflecting it in
// state, so a caller can branch on the outcome immediately or wait for the re-render.

import { useCallback, useEffect, useRef, useState } from 'react';

import { requestMediaStream } from './RequestMediaStream';
import { stopMediaStream } from './StopMediaStream';
import type { MediaStreamResult, MediaStreamStatus } from './MediaStreamResult';

/**
 * Where a `useMediaStream` instance sits in its cycle: `idle` before the first attempt and after `stop`,
 * `pending` while the browser prompt is open, then the {@link MediaStreamStatus} of the last attempt.
 */
export type MediaStreamState = 'idle' | 'pending' | MediaStreamStatus;

/** Tunes a `useMediaStream` instance. */
export interface UseMediaStreamOptions {
  /** Constraints for every `start()` that does not pass its own. Defaults to `{ video: true }` — camera, no microphone. */
  readonly constraints?: MediaStreamConstraints;
}

/** What {@link useMediaStream} returns. */
export interface MediaStreamControls {
  /** The current state — drives the button label, the spinner, and the permission-denied copy. */
  readonly status: MediaStreamState;

  /** The live stream, or `null` whenever `status` is anything but `granted`. Assign to a `<video>`'s `srcObject`. */
  readonly stream: MediaStream | null;

  /** The normalized error from a `failed` attempt; `null` for every other status, including `denied`, which is a decision rather than a failure. */
  readonly error: Error | null;

  /** Acquires a stream, releasing any currently held one first. Resolves to the outcome; never throws. Stable across renders. */
  readonly start: (constraints?: MediaStreamConstraints) => Promise<MediaStreamResult>;

  /** Releases the held stream and returns to `idle`. Idempotent, safe before the first `start`. Stable across renders. */
  readonly stop: () => void;
}

/** The camera-only default — matching `requestCameraStream`, so an unconfigured hook does not silently open the microphone. */
const DefaultConstraints: MediaStreamConstraints = { video: true };

/**
 * Acquires and owns a media stream, releasing it on `stop` and on unmount.
 *
 * ```tsx
 * const camera = useMediaStream();
 * <video ref={(el) => { if (el) el.srcObject = camera.stream; }} autoPlay playsInline muted />
 * <button onClick={() => void camera.start()}>Start</button>
 * ```
 *
 * Both callbacks are stable across renders and inherit the slice's never-throws contract — a rejected promise
 * is not one of the outcomes.
 *
 * @param options Default constraints for `start()`.
 * @returns The state machine plus the two lifecycle callbacks.
 */
export function useMediaStream(options?: UseMediaStreamOptions): MediaStreamControls {
  const [status, setStatus] = useState<MediaStreamState>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Options read through a ref so a fresh `{ constraints: { video: true } }` literal each render does not churn
  // the callback identities — the same shape `foundation/share`'s `useShare` uses.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  /** Releases the held stream and clears the ref. The one place tracks are stopped, so every path funnels here. */
  const release = useCallback((): void => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
  }, []);

  const stop = useCallback((): void => {
    release();
    if (!mountedRef.current) return;
    setStream(null);
    setStatus('idle');
    setError(null);
  }, [release]);

  const start = useCallback(
    async (constraints?: MediaStreamConstraints): Promise<MediaStreamResult> => {
      // Release before acquiring, never after: most phones cannot open two cameras at once, so an overlapping
      // acquisition fails with `NotReadableError` — and on the devices where it succeeds it leaves the first
      // camera live. Same ordering, same reason, as `switchCamera`.
      release();
      if (mountedRef.current) {
        setStream(null);
        setError(null);
        setStatus('pending');
      }

      const result = await requestMediaStream(constraints ?? optionsRef.current?.constraints ?? DefaultConstraints);

      if (!mountedRef.current) {
        // Unmounted while the prompt was open. The stream arrived for a component that no longer exists; nothing
        // else will ever reach it, so it is released here or the device stays held for the life of the tab.
        if (result.status === 'granted') stopMediaStream(result.stream);
        return result;
      }

      if (result.status === 'granted') {
        streamRef.current = result.stream;
        setStream(result.stream);
      }
      setStatus(result.status);
      setError(result.status === 'failed' ? result.error : null);

      return result;
    },
    [release],
  );

  useEffect(() => {
    // Re-armed on mount rather than only initialized at declaration: under StrictMode (and any future remount)
    // the same ref instance is reused, and a stale `false` would make every later `start` discard its stream.
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      release();
    };
  }, [release]);

  return { status, stream, error, start, stop };
}
