// Great-circle distance between two points — the one piece of this slice with no platform dependency at all.
//
// WHY HAVERSINE. It is the standard trade for UI distance: exact on a sphere, ~0.5% worst-case error against
// the real ellipsoid (Vincenty's inverse formula closes that gap at maybe 40× the code and an iterative solve
// that can fail to converge on near-antipodal pairs). For "2.3 km away" on a card, 0.5% is 11 metres. It is
// also numerically well-behaved for SMALL separations, which is the case a UI actually hits — the older
// spherical law of cosines is algebraically equivalent but loses catastrophic precision under ~1 km, where
// `acos` of a value that has rounded to exactly 1 collapses to 0.
//
// THE ANTIMERIDIAN IS HANDLED BY THE FORMULA, NOT BY A SPECIAL CASE. The longitude term is `sin²(Δλ/2)`, and
// sin² is periodic with period π in its argument — so a Δλ of 359° and one of −1° produce the identical term.
// A pair straddling the 180th meridian therefore comes out as the ~111 km it really is, with no normalization,
// no `Δλ > 180 → Δλ − 360` correction, and no branch to get wrong. Anything computed on raw degree deltas
// (`Math.abs(b.longitude - a.longitude) * 111_000`, the naive Euclidean version) reports ~39,900 km for that
// same pair. This is the reason the module exists rather than a one-line helper per consumer.
//
// `atan2(√a, √(1−a))` rather than `asin(√a)`: identical for small `a`, but numerically stable for
// near-antipodal points where `a` approaches 1 and `asin`'s derivative goes to infinity.
//
// RADIUS. 6,371,008.8 m — the IUGG mean radius (R₁) of the WGS-84 ellipsoid, the same constant every mapping
// library uses. The Earth is not a sphere, so the choice of a single radius, not the formula, is the dominant
// error term: 6,371,000 vs 6,378,137 (equatorial) shifts every result by ~0.1%.
//
// NEVER THROWS. Non-finite input yields `NaN` — a value that propagates visibly and compares false against
// every threshold — rather than an exception or a plausible-looking wrong number.

import type { LatLng } from './Coordinates';

/** IUGG mean Earth radius (R₁), in metres. The sphere the haversine result is measured on. */
export const EarthRadiusMetres = 6_371_008.8;

/** Degrees → radians. */
const DegreesToRadians = Math.PI / 180;

/** Whether all four coordinate components are real numbers this can compute on. */
function isMeasurable(a: LatLng, b: LatLng): boolean {
  return (
    Number.isFinite(a.latitude) &&
    Number.isFinite(a.longitude) &&
    Number.isFinite(b.latitude) &&
    Number.isFinite(b.longitude)
  );
}

/**
 * Great-circle ("as the crow flies") distance between two points, in metres.
 *
 * Pure and symmetric — `distanceBetween(a, b) === distanceBetween(b, a)` — and exactly `0` for identical
 * points. Correct across the antimeridian and the poles without any special-casing by the caller. Accepts
 * anything with `latitude` / `longitude`, so a {@link Position} from this slice can be passed directly.
 *
 * Not road distance and not ellipsoidal: ~0.5% worst case against a geodesic solution, dominated by the
 * spherical-Earth assumption rather than by the formula. Fine for proximity, sorting, and radius filters; not
 * for surveying.
 *
 * Never throws. Returns `NaN` if any component is `NaN`, `Infinity`, or otherwise not a finite number.
 *
 * @param a One endpoint.
 * @param b The other endpoint.
 * @returns Metres along the great circle, or `NaN` for unmeasurable input.
 */
export function distanceBetween(a: LatLng, b: LatLng): number {
  if (!isMeasurable(a, b)) return Number.NaN;

  const latitudeA = a.latitude * DegreesToRadians;
  const latitudeB = b.latitude * DegreesToRadians;
  const halfLatitudeDelta = ((b.latitude - a.latitude) * DegreesToRadians) / 2;
  const halfLongitudeDelta = ((b.longitude - a.longitude) * DegreesToRadians) / 2;

  const chord =
    Math.sin(halfLatitudeDelta) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(halfLongitudeDelta) ** 2;

  return 2 * EarthRadiusMetres * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}
