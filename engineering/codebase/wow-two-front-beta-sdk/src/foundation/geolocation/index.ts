// geolocation — foundation seam. The Geolocation API vector: `canLocate` (capability), `getCurrentPosition`
// (one-shot read, six typed outcomes), `watchPosition` (continuous tracking, disposer-shaped),
// `getGeolocationPermission` (the grant), `distanceBetween` (haversine, platform-free), and the two React
// bindings `useGeolocation` / `useWatchPosition`. No HTTP, no components — a "Use my location" button or a map
// pin is a consumer of these rules, not their owner; React appears only in the two `Use*` modules.
//
// DEFINING CONTRACT: NOTHING HERE THROWS. Every entry point is invoked from a click handler or an effect and
// answers with a value — a boolean, a state, a discriminated result — instead of throwing or rejecting, so a
// consumer never needs a `try` around a location read. `unsupported` is a first-class member of the result
// union rather than an error: SSR, a stripped webview, and a browser with the API behind a flag are ordinary
// conditions a UI has to render, not exceptions to handle.
//
// THE ERROR CODES ARE THE VALUE. `GeolocationPositionError` reports failure as a bare integer, and the three
// values demand different UI: `denied` (1) is permanent for the origin and must stop the asking, `unavailable`
// (2) is the common indoors case and is retryable, `timeout` (3) is retryable with a bigger budget. This slice
// exists so no consumer collapses them into "location error" and tells a user in a basement to check their
// browser permissions. Mapping lives in `PositionResult.ts`, against numeric literals — the named constants sit
// on a platform constructor that is absent under SSR and absent on any test double.
//
// NO HOST OBJECT ESCAPES. `GeolocationPosition` is converted at the boundary into a flat, plain, cloneable
// `Position` snapshot: the platform's object does not survive `structuredClone` or `JSON.stringify` (its data
// lives on prototype accessors) and in some engines is mutated in place on the next fix. See `Coordinates.ts`.
//
// A WATCH IS A BATTERY LIABILITY. `watchPosition` returns a disposer rather than an id so it cannot be started
// and forgotten; a live watch holds the location hardware on, outlives the component that started it, and is
// invisible to every metric a web app has. `useWatchPosition` binds that lifetime to a component's.
//
// SCOPE BOUNDARY — the permission read is DELEGATED, not implemented. `getGeolocationPermission` calls
// `queryPermission('geolocation')` from `foundation/notifications`, which already owns the generic
// `navigator.permissions` wrapper (its home there is historical; nothing about it is notification-specific).
// A second wrapper here would drift from that one. Following permission CHANGES uses that slice's
// `usePermissionState('geolocation')` directly — it is generic, so this slice does not re-export a copy of it.
// Note that geolocation has no `requestPermission()` at all: the only way to raise the prompt is to ask for a
// position, so `getCurrentPosition` is the request path.

export { type LatLng, type Coordinates, type Position } from './Coordinates';

export { canLocate } from './CanLocate';

export {
  type PositionResult,
  type PositionStatus,
  type PositionRequestOptions,
  UnreadablePositionMessage,
} from './PositionResult';

export { getCurrentPosition } from './GetCurrentPosition';

export { watchPosition, type PositionHandler } from './WatchPosition';

export { getGeolocationPermission, type PermissionQueryState } from './GeolocationPermission';

export { distanceBetween, EarthRadiusMetres } from './DistanceBetween';

export { type GeolocationState, type GeolocationReading } from './GeolocationReading';

export { useGeolocation, type GeolocationControls } from './UseGeolocation';

export { useWatchPosition } from './UseWatchPosition';
