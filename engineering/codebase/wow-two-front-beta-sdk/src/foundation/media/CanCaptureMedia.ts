// Feature detection for the media-capture vector, and the one distinction that earns this module its own file:
// `getUserMedia` is gated on a SECURE CONTEXT, and browsers enforce that by hiding `navigator.mediaDevices`
// ENTIRELY rather than by rejecting the call. On a plain-HTTP page the API therefore looks *unimplemented* — the
// developer reads "this browser has no camera support" off a browser that supports it perfectly, and goes hunting
// for a polyfill instead of an `https://`. (`localhost` counts as secure, so it works in dev and breaks on the
// first LAN-IP test.) That misreading costs real debugging time, so the insecure case gets its own reason
// instead of collapsing into `unsupported`.
//
// Order of evidence: a present `getUserMedia` outranks the `isSecureContext` flag. Where the API is there, the
// call itself answers accurately, and pre-emptively reporting `insecure-context` would block a working path.
// `isSecureContext` is consulted only to *explain* an absent API.
//
// Every read is guarded. `navigator` is absent under SSR, `mediaDevices` is absent on insecure pages and older
// browsers, and `isSecureContext` is absent outside a browser — Node reports `undefined`, which must NOT read as
// insecure: "unknown" is not "no". A detector that throws defeats its own purpose, so the answer is total.

/**
 * Why media capture is (un)available here.
 *
 * - `supported` — `navigator.mediaDevices.getUserMedia` is present and callable.
 * - `insecure-context` — the API is absent *and* the page is known to be a non-secure context. Actionable:
 *   serve over HTTPS (or `localhost`). Distinguished from `unsupported` because the fix is completely different.
 * - `unsupported` — no API and no evidence the context is the reason: SSR, a worker, an older browser.
 */
export type MediaSupport = 'supported' | 'insecure-context' | 'unsupported';

/**
 * Reads `navigator.mediaDevices` when it exists and carries `member` as a callable.
 *
 * Two members are asked for separately because they fail separately: a browser can expose `enumerateDevices`
 * (device *existence*, no permission needed) while `getUserMedia` is missing or blocked. Guarded end-to-end;
 * returns `undefined` under SSR. Internal to the slice — used by the sibling modules, absent from the barrel.
 *
 * @param member The method the caller is about to invoke.
 * @returns The `MediaDevices` object, or `undefined` when it or `member` is unusable.
 */
export function mediaDevicesWith(member: 'getUserMedia' | 'enumerateDevices'): MediaDevices | undefined {
  try {
    if (typeof navigator === 'undefined') return undefined;

    const devices: unknown = navigator.mediaDevices;
    if (typeof devices !== 'object' || devices === null) return undefined;

    const api = devices as MediaDevices;
    if (typeof api[member] !== 'function') return undefined;
    return api;
  } catch {
    // A throwing `navigator` / `mediaDevices` getter (a partial polyfill) reads as absent — same posture as
    // `foundation/errors`' guarded reads and `foundation/share`'s `hasNativeShare`.
    return undefined;
  }
}

/**
 * Whether the page is *known* to be a non-secure context.
 *
 * Only an explicit `false` counts. `undefined` — Node, a stripped global, an engine predating the flag — means
 * the question could not be answered, and answering "insecure" there would blame HTTP for an absent API in an
 * environment that has no HTTP at all.
 */
function isKnownInsecureContext(): boolean {
  try {
    // Read through an `unknown` cast rather than the DOM lib's `declare var isSecureContext: boolean`: outside a
    // browser the global is genuinely missing, so the typed view is a lie this module must not act on.
    const secure: unknown = (globalThis as { isSecureContext?: unknown }).isSecureContext;
    return secure === false;
  } catch {
    return false;
  }
}

/**
 * Reports whether media capture is available here, and when it is not, why.
 *
 * The `insecure-context` answer is the one worth rendering differently: it is the only reason a consumer can
 * actually act on ("this page must be served over HTTPS"), where `unsupported` is terminal for that visit.
 *
 * Never throws. Returns `unsupported` under SSR.
 */
export function getMediaSupport(): MediaSupport {
  if (mediaDevicesWith('getUserMedia') !== undefined) return 'supported';
  return isKnownInsecureContext() ? 'insecure-context' : 'unsupported';
}

/**
 * Reports whether `requestMediaStream` and friends can reach a real `getUserMedia`.
 *
 * The boolean form of {@link getMediaSupport} — for a plain "hide the camera button" check that does not care
 * *why*. Never throws. Returns `false` under SSR.
 */
export function canCaptureMedia(): boolean {
  return getMediaSupport() === 'supported';
}
