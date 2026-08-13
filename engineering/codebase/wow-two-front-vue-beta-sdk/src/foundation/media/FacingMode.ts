// Front / back camera selection, and the two mistakes it invites.
//
// MISTAKE 1 — `exact`. `facingMode: { exact: 'environment' }` rejects with `OverconstrainedError` on every
// device without a rear camera: all desktops, all laptops, most external webcams. Those devices do not report
// `facingMode` at all, so `exact` is not "prefer the back camera", it is "fail unless there is one". `ideal` is
// the default here for that reason — it picks the rear camera on a phone and degrades to the only camera on a
// laptop. `exact` stays available for the case that genuinely needs it (a document scanner where the selfie cam
// is useless), where failing loudly beats capturing the wrong thing.
//
// MISTAKE 2 — switching by acquiring first. The natural "get the new stream, then stop the old one" ordering
// breaks on mobile: most phones cannot open both cameras at once, so the second `getUserMedia` fails with
// `NotReadableError` while the first camera is still held — a flip button that works on a laptop and never on a
// phone. `switchCamera` therefore stops FIRST. The trade-off is deliberate and visible: a failed acquisition
// leaves the caller with no stream at all, which is the honest outcome (the old stream's device is already
// released) and is reported as an ordinary failure arm.

import { requestCameraStream } from './RequestMediaStream';
import { stopMediaStream } from './StopMediaStream';
import type { MediaStreamResult } from './MediaStreamResult';

/**
 * Which camera to prefer.
 *
 * - `user` — front / selfie camera, facing the user.
 * - `environment` — rear camera, facing away. What a scanner or a document capture wants.
 */
export type FacingMode = 'user' | 'environment';

/** Tunes how a facing-mode preference is expressed as constraints. */
export interface FacingModeOptions {
  /**
   * Whether to demand the facing mode rather than prefer it. `true` emits `{ exact }`, which REJECTS with
   * `OverconstrainedError` on any device lacking that camera — see the module header. Defaults to `false`
   * (`{ ideal }`), which degrades to whatever camera exists.
   */
  readonly exact?: boolean;

  /** Extra video track constraints to merge — resolution, frame rate, `deviceId`. A `facingMode` here is overwritten. */
  readonly video?: MediaTrackConstraints;
}

/**
 * Builds video track constraints expressing a facing-mode preference.
 *
 * Feed the result to {@link requestCameraStream}. Pure — no device access, nothing to fail, so it needs no
 * result type and never throws.
 *
 * @param facingMode The camera to prefer.
 * @param options Whether to demand rather than prefer it, plus any extra track constraints to merge.
 * @returns The merged `MediaTrackConstraints`, with `facingMode` applied last.
 */
export function facingModeConstraints(facingMode: FacingMode, options?: FacingModeOptions): MediaTrackConstraints {
  return {
    ...options?.video,
    // Applied after the spread on purpose: this function's whole subject is `facingMode`, so a stale one carried
    // in via `options.video` must not win over the argument the caller just passed.
    facingMode: options?.exact === true ? { exact: facingMode } : { ideal: facingMode },
  };
}

/**
 * Flips to the other camera: releases `current`, then acquires a stream for `facingMode`.
 *
 * Stops first, always — two camera streams must never be held at once (module header). `current` may be `null`,
 * which makes this usable as the first acquisition too, so a flip button needs no special case for its initial
 * press.
 *
 * Never throws, never rejects.
 *
 * @param current The stream to release. Pass `null` when nothing is live yet.
 * @param facingMode The camera to switch to.
 * @param options Whether to demand rather than prefer it, plus any extra track constraints.
 * @returns The typed outcome of the new acquisition. Anything other than `granted` means nothing is live now.
 */
export function switchCamera(
  current: MediaStream | null | undefined,
  facingMode: FacingMode,
  options?: FacingModeOptions,
): Promise<MediaStreamResult> {
  stopMediaStream(current);
  return requestCameraStream(facingModeConstraints(facingMode, options));
}
