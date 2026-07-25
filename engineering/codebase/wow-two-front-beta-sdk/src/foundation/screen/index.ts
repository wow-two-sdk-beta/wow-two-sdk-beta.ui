// screen — foundation seam. The three APIs that ACT on the display: the Fullscreen API (`enterFullscreen` /
// `exitFullscreen` / `toggleFullscreen` / `useFullscreen`), the Screen Wake Lock API (`requestWakeLock` /
// `holdWakeLock` / `useWakeLock`), and the Screen Orientation API (`lockOrientation` / `unlockOrientation` /
// `useOrientation`). No components, no media queries — a fullscreen button is a consumer of these rules, not
// their owner; React appears only in the three `Use*` files.
//
// BOUNDARY WITH `foundation/device`, which is the slice most easily confused with this one:
//
//   - `device` ASKS. It answers "how is the app being displayed?" — `useDisplayMode` / `useIsInstalled` read the
//     CSS `display-mode` media feature, `usePointerType` reads pointer precision. Read-only, declarative,
//     media-query-driven, and it never changes anything.
//   - `screen` ACTS. It enters fullscreen, holds a wake lock, locks orientation. Imperative, permissioned, and
//     every call can be refused by the platform — hence a result union rather than a plain value.
//
// So the media-query detection is NOT duplicated here: there is no `matchMedia` in this slice at all.
// `useDisplayMode() === DisplayMode.Fullscreen` remains the way to observe fullscreen-ness declaratively (it also
// catches an OS-level fullscreen this app never requested), while `useFullscreen().isFullscreen` reports the
// Fullscreen API's own `fullscreenElement`. They answer subtly different questions and both are correct; reach
// for `device` to render differently, for `screen` to drive the transition.
//
// Orientation names likewise stay disambiguated: `foundation/utils`' `Orientation` is a component LAYOUT axis
// (horizontal / vertical); this slice's `ScreenOrientationType` is a DEVICE orientation (portrait / landscape).
// Unrelated vocabularies, deliberately un-collidable names.
//
// DEFINING CONTRACT: NOTHING HERE THROWS. Every entry point is invoked from a click handler and returns a
// discriminated result — `ok` / `unsupported` / `denied` / `requires-gesture` / `failed` — so a consumer never
// needs a `try`. `requires-gesture` is broken out from `failed` because it is the one failure with a mechanical
// fix (move the call into the gesture), and `ScreenOrientation`'s `lock` widens the union with
// `requires-fullscreen` for the same reason. Under SSR every read returns a defined empty answer and every action
// returns `unsupported`.

export {
  type ScreenResult,
  type ScreenValueResult,
  type ScreenFailure,
  type ScreenStatus,
} from './ScreenResult';

export {
  enterFullscreen,
  exitFullscreen,
  toggleFullscreen,
  isFullscreen,
  isFullscreenSupported,
  getFullscreenElement,
  onFullscreenChange,
} from './Fullscreen';
export { useFullscreen, type FullscreenControls } from './UseFullscreen';

export {
  requestWakeLock,
  holdWakeLock,
  WakeLockKind,
  IdleWakeLockState,
  type WakeLockHandle,
  type WakeLockHold,
  type WakeLockHoldOptions,
  type WakeLockState,
  type WakeLockStatus,
} from './WakeLock';
export { useWakeLock } from './UseWakeLock';

export {
  lockOrientation,
  unlockOrientation,
  getOrientation,
  getOrientationAngle,
  isOrientationLockSupported,
  onOrientationChange,
  ScreenOrientationType,
  ScreenOrientationLock,
  type OrientationLockResult,
  type OrientationLockStatus,
} from './ScreenOrientation';
export { useOrientation, type OrientationControls } from './UseOrientation';
