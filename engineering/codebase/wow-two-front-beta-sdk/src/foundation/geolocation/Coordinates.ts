// The boundary type of the geolocation vector: a flat, plain, structurally-cloneable snapshot of one fix.
//
// WHY NOT PASS `GeolocationPosition` THROUGH. The object the platform hands the success callback is a HOST
// object, and every awkward property of one applies:
//  - it is not structurally cloneable in a useful way and does not survive `JSON.stringify` — its data sits on
//    accessors on the prototype, so a naive clone or serialize yields `{}`. Storing it in React state and then
//    persisting that state (localStorage, an IndexedDB cache, a `postMessage` to a worker) silently loses the
//    coordinates;
//  - it is LIVE in some engines — the same `coords` object mutated in place on the next fix — so a consumer
//    holding two "different" readings can find they compare equal;
//  - nesting (`position.coords.latitude`) forces every consumer and every assertion through two hops for data
//    that has exactly one shape.
// So the conversion happens once, here, at the boundary: the platform object never leaves this slice, and what
// a consumer holds is an ordinary frozen-in-time record of numbers.
//
// FLAT, NOT NESTED. `Position` is `Coordinates` plus `timestamp` rather than `{ coords, timestamp }`. There is
// no second coordinate set to disambiguate, and flattening makes both the consumer's read and the test's
// `toEqual` a single level.
//
// `number | null`, NOT `number | undefined`, for the optional channels. That is what the platform reports for a
// device with no altimeter or no heading, `null` survives `structuredClone` and `JSON` round-trips unchanged
// (an optional property carrying `undefined` does not — it disappears), and it keeps "the platform answered,
// with nothing" distinct from "the key was never set".
//
// HOSTILE READS. Every property here is read off an object this module did not create, through guarded reads:
// a host accessor can throw, and a test double or a polyfill can supply anything at all. An unreadable required
// field yields `null` from {@link toPosition} — a defined answer the caller turns into a `failed` result —
// rather than an exception escaping a platform callback, where nothing can catch it.

/** The minimum a point needs to be positioned on a sphere — the input {@link distanceBetween} accepts. */
export interface LatLng {
  /** Degrees north of the equator, negative for south. */
  readonly latitude: number;

  /** Degrees east of the prime meridian, negative for west. */
  readonly longitude: number;
}

/** One fix's spatial data, flattened out of the platform's `GeolocationCoordinates`. */
export interface Coordinates extends LatLng {
  /** Radius of the 95%-confidence circle around the position, in metres. Always present; never negative. */
  readonly accuracy: number;

  /** Metres above the WGS-84 ellipsoid, or `null` where the device cannot measure altitude. */
  readonly altitude: number | null;

  /** Confidence interval on {@link Coordinates.altitude}, in metres, or `null` when altitude is `null`. */
  readonly altitudeAccuracy: number | null;

  /** Direction of travel in degrees clockwise from true north, or `null` when stationary or unmeasurable. */
  readonly heading: number | null;

  /** Ground speed in metres per second, or `null` where the device cannot measure it. */
  readonly speed: number | null;
}

/** A complete fix: where the device was, and when. The value every entry point in this slice hands back. */
export interface Position extends Coordinates {
  /** Milliseconds since the epoch at which the fix was taken — same base as `Date.now()`. */
  readonly timestamp: number;
}

/**
 * Reads one numeric field off an object of unknown provenance. Returns `null` for a missing field, a
 * non-numeric one, `NaN`/`Infinity`, or an accessor that throws — all of which mean the same thing to the
 * caller: no usable number here.
 */
function readFiniteNumber(source: object, key: string): number | null {
  try {
    const value: unknown = (source as Record<string, unknown>)[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** Reads a nested object field, guarded the same way. Returns `null` when it is absent or not an object. */
function readObject(source: object, key: string): object | null {
  try {
    const value: unknown = (source as Record<string, unknown>)[key];
    return typeof value === 'object' && value !== null ? value : null;
  } catch {
    return null;
  }
}

/**
 * Converts the platform's position object into a plain {@link Position}, or `null` when it carries no usable
 * fix. Exported for the sibling modules that own the platform callbacks; absent from the barrel, where a
 * consumer only ever meets the converted form.
 *
 * `latitude`, `longitude` and `accuracy` are load-bearing: without all three there is no position to report, so
 * an unreadable one collapses the whole reading to `null`. The optional channels degrade individually to
 * `null`. A missing or unreadable `timestamp` falls back to `Date.now()` — the read is happening now, and a fix
 * without a time is harder to use than one with an approximate one.
 *
 * Never throws.
 *
 * @param raw The value handed to a `getCurrentPosition` / `watchPosition` success callback.
 * @returns The plain snapshot, or `null` if no fix could be read out of it.
 */
export function toPosition(raw: unknown): Position | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const coords = readObject(raw, 'coords');
  if (coords === null) return null;

  const latitude = readFiniteNumber(coords, 'latitude');
  const longitude = readFiniteNumber(coords, 'longitude');
  const accuracy = readFiniteNumber(coords, 'accuracy');
  if (latitude === null || longitude === null || accuracy === null) return null;

  return {
    latitude,
    longitude,
    accuracy,
    altitude: readFiniteNumber(coords, 'altitude'),
    altitudeAccuracy: readFiniteNumber(coords, 'altitudeAccuracy'),
    heading: readFiniteNumber(coords, 'heading'),
    speed: readFiniteNumber(coords, 'speed'),
    timestamp: readFiniteNumber(raw, 'timestamp') ?? Date.now(),
  };
}
