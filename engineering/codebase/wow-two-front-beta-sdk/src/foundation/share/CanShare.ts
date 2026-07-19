// Feature detection for the share vector. Two conditions, kept deliberately separate: `navigator.share` must
// exist at all, and — only when the payload carries files — `navigator.canShare` must accept it. File sharing is
// supported far more narrowly than text / url sharing, and is the one case the platform itself can veto.
//
// Every read is guarded. `navigator` is absent under SSR, the members are absent on most desktop browsers, and a
// property read can in principle throw (a polyfill's getter). A detector that throws defeats its own purpose, so
// the answer is always a boolean.

import { toNativeSharePayload, type ShareData } from './ShareData';

/** Whether the environment exposes `navigator.share`. False under SSR (no `navigator`) and on non-supporting browsers. */
function hasNativeShare(): boolean {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  } catch {
    // A throwing `navigator` / `share` getter reads as absent — same posture as `foundation/errors`' guarded reads.
    return false;
  }
}

/**
 * Reports whether `share` can hand `data` to a native share sheet.
 *
 * With no argument — or a file-free payload — this is pure availability: does `navigator.share` exist. When
 * `data.files` is present the platform is asked directly via `navigator.canShare`, and a missing `canShare` is
 * treated as a no: a browser that cannot answer the file question is not one to hand files to.
 *
 * Never throws. Returns `false` under SSR.
 */
export function canShare(data?: ShareData): boolean {
  if (!hasNativeShare()) return false;
  if (data?.files === undefined) return true;

  try {
    if (typeof navigator.canShare !== 'function') return false;
    return navigator.canShare(toNativeSharePayload(data)) === true;
  } catch {
    // `canShare` is specified not to throw, but a partial implementation may. Unverifiable reads as unsupported.
    return false;
  }
}
