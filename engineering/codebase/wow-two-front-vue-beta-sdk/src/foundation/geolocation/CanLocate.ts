// Capability detection for the Geolocation API — the one guard every other module in this slice runs first.
//
// Three absences collapse to the same answer, and all three are ordinary rather than exceptional:
//  - no `navigator` at all — SSR, or a worker without one;
//  - `navigator` present but no `geolocation` — a stripped embedded webview, a privacy build, a test double;
//  - `geolocation` present but not actually callable — a partial polyfill, a `Proxy` stand-in.
// Each is checked by shape rather than by trusting the type declarations, because at runtime the DOM lib's
// promise that `navigator.geolocation` exists is only a promise.
//
// The whole probe sits in a `try`: on a hardened page `navigator` can be a `Proxy` whose `get` trap throws, and
// a capability probe that throws would defeat its own purpose.
//
// NOT DETECTED HERE: whether geolocation is permitted. A secure-context violation, a `Permissions-Policy` block
// and a user denial all leave the API present and callable — they surface as a `denied` / `failed` RESULT from
// the call, not as a missing capability. `canLocate()` answers "is there an API to ask", never "will it work".

/**
 * Returns `navigator.geolocation` when it is present and callable, `undefined` otherwise. Exported for the
 * sibling modules, which need the object itself; absent from the barrel, where {@link canLocate} is the boolean
 * a consumer wants.
 *
 * Never throws.
 */
export function geolocationApi(): Geolocation | undefined {
  try {
    if (typeof navigator === 'undefined') return undefined;

    const geolocation: unknown = navigator.geolocation;
    if (typeof geolocation !== 'object' || geolocation === null) return undefined;
    if (typeof (geolocation as Geolocation).getCurrentPosition !== 'function') return undefined;

    return geolocation as Geolocation;
  } catch {
    return undefined;
  }
}

/**
 * Whether this environment exposes a usable Geolocation API.
 *
 * Use it to decide whether to render a "Use my location" affordance at all. It does NOT predict success: the
 * API can be present and still answer `denied` (user or policy) or `unavailable` (no fix). Treat a `false` as
 * "hide the feature" and the call's own result as "what happened".
 *
 * Never throws. Returns `false` under SSR.
 */
export function canLocate(): boolean {
  return geolocationApi() !== undefined;
}
