// The Vue binding of the capture vector — a state machine over `requestMediaStream` whose real job is OWNING
// the stream, because a component that forgets to release one leaves the camera light on after it is gone.
//
// Three release paths, all of which have to work or the leak is back:
//  1. `stop()` — the explicit one.
//  2. Scope disposal — `onScopeDispose`. The common case: the user navigates away with the preview open.
//  3. Disposal WHILE A PROMPT IS OPEN — the one that is always missed. The user presses Allow after the
//     component has gone; the promise resolves with a live stream nobody will ever render, and no disposal
//     cleanup can reach it because it did not exist when the cleanup ran. `start` therefore re-checks
//     liveness after the await and releases the arriving stream itself.
//
// The live stream is held in a plain closure variable as well as in the ref. The disposal hook must reach the
// CURRENT stream, and reading the reactive value there would tie teardown to render timing for no benefit — the
// closure variable is the single authority every release path funnels through.
//
// Acquisition is on demand — no `autoStart`, and nothing touches `navigator.mediaDevices` at setup. That keeps
// the SSR pass inert by construction, and a permission prompt fired without a user gesture is both a worse
// experience and rate-limited by browsers. A click calls `start`.
//
// Never throws: `start` inherits the module's contract and resolves to the result as well as reflecting it in
// reactive state, so a caller can branch on the outcome immediately or watch the refs.

import { onScopeDispose, shallowRef, toValue, type MaybeRefOrGetter, type ShallowRef } from 'vue';

import type { MediaStreamResult, MediaStreamStatus } from './MediaStreamResult';
import { requestMediaStream } from './RequestMediaStream';
import { stopMediaStream } from './StopMediaStream';

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
  readonly status: Readonly<ShallowRef<MediaStreamState>>;

  /** The live stream, or `null` whenever `status` is anything but `granted`. Assign to a `<video>`'s `srcObject`. */
  readonly stream: Readonly<ShallowRef<MediaStream | null>>;

  /** The normalized error from a `failed` attempt; `null` for every other status, including `denied`, which is a decision rather than a failure. */
  readonly error: Readonly<ShallowRef<Error | null>>;

  /** Acquires a stream, releasing any currently held one first. Resolves to the outcome; never throws. */
  readonly start: (constraints?: MediaStreamConstraints) => Promise<MediaStreamResult>;

  /** Releases the held stream and returns to `idle`. Idempotent, safe before the first `start`. */
  readonly stop: () => void;
}

/** The camera-only default — matching `requestCameraStream`, so an unconfigured composable does not silently open the microphone. */
const DefaultConstraints: MediaStreamConstraints = { video: true };

/**
 * Acquires and owns a media stream, releasing it on `stop` and when the scope is disposed.
 *
 * ```vue
 * const camera = useMediaStream();
 * <video ref="videoEl" autoplay playsinline muted />
 * <button @click="camera.start()">Start</button>
 * // watchEffect(() => { if (videoEl.value) videoEl.value.srcObject = camera.stream.value; })
 * ```
 *
 * Inherits the slice's never-throws contract — a rejected promise is not one of the outcomes.
 *
 * @param options Default constraints for `start()`. A ref or getter is read at call time.
 * @returns The state machine plus the two lifecycle callbacks.
 */
export function useMediaStream(options?: MaybeRefOrGetter<UseMediaStreamOptions | undefined>): MediaStreamControls {
  const status = shallowRef<MediaStreamState>('idle');
  const stream = shallowRef<MediaStream | null>(null);
  const error = shallowRef<Error | null>(null);

  let held: MediaStream | null = null;
  let disposed = false;

  /** Releases the held stream and clears the handle. The one place tracks are stopped, so every path funnels here. */
  function release(): void {
    stopMediaStream(held);
    held = null;
  }

  const stop = (): void => {
    release();
    if (disposed) return;
    stream.value = null;
    status.value = 'idle';
    error.value = null;
  };

  const start = async (constraints?: MediaStreamConstraints): Promise<MediaStreamResult> => {
    // Release before acquiring, never after: most phones cannot open two cameras at once, so an overlapping
    // acquisition fails with `NotReadableError` — and on the devices where it succeeds it leaves the first
    // camera live. Same ordering, same reason, as `switchCamera`.
    release();
    if (!disposed) {
      stream.value = null;
      error.value = null;
      status.value = 'pending';
    }

    const result = await requestMediaStream(constraints ?? toValue(options)?.constraints ?? DefaultConstraints);

    if (disposed) {
      // Torn down while the prompt was open. The stream arrived for a component that no longer exists; nothing
      // else will ever reach it, so it is released here or the device stays held for the life of the tab.
      if (result.status === 'granted') stopMediaStream(result.stream);
      return result;
    }

    if (result.status === 'granted') {
      held = result.stream;
      stream.value = result.stream;
    }
    status.value = result.status;
    error.value = result.status === 'failed' ? result.error : null;

    return result;
  };

  onScopeDispose(() => {
    disposed = true;
    release();
  });

  return { status, stream, error, start, stop };
}
