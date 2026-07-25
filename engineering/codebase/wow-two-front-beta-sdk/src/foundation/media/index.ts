// media — foundation seam. The camera / microphone capture vector: `canCaptureMedia` + `getMediaSupport`
// (capability), `requestMediaStream` / `requestCameraStream` / `requestMicrophoneStream` (acquisition, six typed
// outcomes), `listMediaDevices` + `hasCamera` / `hasMicrophone` (inventory), `stopMediaStream` (release),
// `facingModeConstraints` + `switchCamera` (front / back selection), and `useMediaStream` (the React binding
// that owns a stream's lifecycle). No components — a camera preview is a consumer of these rules, not their
// owner; React appears only in `UseMediaStream`.
//
// DEFINING CONTRACT: NOTHING HERE THROWS. Every entry point is invoked from a click handler or an effect and
// answers with a value — a boolean, a grouped list, or a discriminated result — instead of throwing or
// rejecting, so a consumer never needs a `try` around a capture. `denied` and `unsupported` are first-class
// statuses rather than errors: a user pressing Block and a laptop without a webcam are ordinary conditions a UI
// has to render, not exceptions to handle.
//
// The `getUserMedia` rejection table is the substance of the slice. One rejected promise carries at least four
// distinct meanings — blocked · no such device · device busy · everything else — separated only by a
// `DOMException` name, and a consumer that collapses them shows "camera unavailable" to a user whose actual fix
// is a browser setting. `MediaStreamResult` keeps them apart, legacy engine names included (`PermissionDenied`,
// `DevicesNotFound`, `TrackStart`); `MediaStreamResult.ts` documents which names are deliberately NOT mapped.
//
// TWO GOTCHAS THIS SLICE EXISTS TO ABSORB, both silent and both expensive:
//  - Insecure context. `getUserMedia` requires HTTPS, and browsers enforce it by hiding `navigator.mediaDevices`
//    entirely — so a plain-HTTP page looks like a browser without camera support. `getMediaSupport` reports
//    `insecure-context` as its own reason. See `CanCaptureMedia.ts`.
//  - Unreleased streams. Dropping a `MediaStream` does not stop it: the camera light stays on and the device
//    stays locked until the tab closes. `stopMediaStream` stops every track (a stream has no `stop()` of its
//    own), and `useMediaStream` calls it on unmount — including for a stream that arrives *after* unmount, when
//    the user answered the prompt late. See `StopMediaStream.ts` and `UseMediaStream.ts`.
//
// Empty device labels are a third, less costly one: `enumerateDevices` blanks every `label` until capture
// permission has been granted, so a device picker must acquire a stream before it can name anything. Counts stay
// accurate, which is what keeps `hasCamera` useful before prompting. See `ListMediaDevices.ts`.
//
// Scope boundary: the generic `navigator.permissions.query` seam stays in `foundation/notifications`
// (`queryPermission`). `getCameraPermission` / `getMicrophonePermission` here are name-pinning delegations to it,
// never a second implementation — and they are a hint for copy, never a gate: only a real request result is
// authoritative, and Firefox answers `unsupported` for both names.

export { canCaptureMedia, getMediaSupport, type MediaSupport } from './CanCaptureMedia';

export { type MediaStreamResult, type MediaStreamStatus, type MediaStreamFailure } from './MediaStreamResult';

export { requestMediaStream, requestCameraStream, requestMicrophoneStream } from './RequestMediaStream';

export { listMediaDevices, hasCamera, hasMicrophone, type MediaDeviceGroups } from './ListMediaDevices';

export { stopMediaStream } from './StopMediaStream';

export { facingModeConstraints, switchCamera, type FacingMode, type FacingModeOptions } from './FacingMode';

export { getCameraPermission, getMicrophonePermission, type PermissionQueryState } from './MediaPermission';

export {
  useMediaStream,
  type MediaStreamControls,
  type MediaStreamState,
  type UseMediaStreamOptions,
} from './UseMediaStream';
