// The Screen Orientation API — reading which way the device is held, and asking it to stay that way.
//
// LOCKING ALMOST ALWAYS NEEDS FULLSCREEN. On mobile Chromium — the only place `lock()` meaningfully works — the
// document must already be fullscreen, and a call from a normal page rejects. Desktop browsers reject it
// outright, and Safari does not implement `lock()` at all on any platform. So the realistic sequence is
// `enterFullscreen()` first, `lockOrientation()` second, and a consumer that skips the first step gets a
// rejection that has nothing to do with orientation being unavailable.
//
// That is why `requires-fullscreen` is its own status. Reported as `failed` it reads as "orientation locking is
// broken here" and a consumer hides the feature; reported accurately it says "you called this too early", which
// is fixable in one line. The union is widened for this one entry point rather than for the whole slice, the
// same way `foundation/share` widens `ShareResult` with `copied` for `shareOrCopy` alone — the extra leg exists
// where it is real and nowhere else.
//
// NAMING, because this repo has two orientations: `foundation/utils`' `Orientation` is a LAYOUT axis
// (horizontal / vertical) for components. This slice's `ScreenOrientationType` is a DEVICE orientation
// (portrait-primary / landscape-secondary …). They are unrelated vocabularies and the `Screen` prefix keeps an
// import from silently resolving to the wrong one.
//
// The read and lock vocabularies differ, which is not an accident of this file: the platform reports one of four
// concrete orientations, but accepts eight lock targets including the relative `natural`, `portrait`, and
// `landscape`. Modelling them as one type would let `getOrientation()` claim to return `any`.
//
// KNOWN GAP — the legacy `window.orientationchange` event and `window.orientation` angle are deliberately NOT
// read. They are the only signal on iOS before 16.4, but `screen.orientation` is absent there too, so a
// subscription would fire against a `getOrientation()` that returns `null` regardless. One mechanism, one
// answer; the same call `foundation/device`'s `useDisplayMode` makes about `navigator.standalone`.

import { toError } from '../errors';

import { getScreen, isFunction, readMember } from './ScreenEnvironment';
import type { ScreenResult } from './ScreenResult';

/** The concrete orientations the platform reports — what `getOrientation` can return. */
export const ScreenOrientationType = {
  /** Upright, the device's natural portrait. */
  PortraitPrimary: 'portrait-primary',
  /** Upside-down portrait. */
  PortraitSecondary: 'portrait-secondary',
  /** Rotated a quarter turn from natural portrait. */
  LandscapePrimary: 'landscape-primary',
  /** Rotated the other quarter turn. */
  LandscapeSecondary: 'landscape-secondary',
} as const;

/** One of the {@link ScreenOrientationType} values. */
export type ScreenOrientationType = (typeof ScreenOrientationType)[keyof typeof ScreenOrientationType];

/** The lock targets the platform accepts — the four concrete orientations plus four relative ones. */
export const ScreenOrientationLock = {
  /** Any orientation — effectively releases a lock while keeping one nominally set. */
  Any: 'any',
  /** The device's own natural orientation, whichever that is. */
  Natural: 'natural',
  /** Either portrait orientation, letting the device flip between them. */
  Portrait: 'portrait',
  /** Either landscape orientation. */
  Landscape: 'landscape',
  /** Upright portrait only. */
  PortraitPrimary: 'portrait-primary',
  /** Upside-down portrait only. */
  PortraitSecondary: 'portrait-secondary',
  /** One landscape direction only. */
  LandscapePrimary: 'landscape-primary',
  /** The other landscape direction only. */
  LandscapeSecondary: 'landscape-secondary',
} as const;

/** One of the {@link ScreenOrientationLock} values. */
export type ScreenOrientationLock = (typeof ScreenOrientationLock)[keyof typeof ScreenOrientationLock];

/**
 * A {@link ScreenResult} widened with the precondition that only orientation locking has.
 *
 * `requires-fullscreen` means the API is present and willing, but the document is not fullscreen — enter
 * fullscreen and retry. Distinct from `denied` (the platform refused outright) and from `unsupported` (this
 * device cannot lock at all, which is every desktop browser and all of Safari).
 */
export type OrientationLockResult = ScreenResult | { readonly status: 'requires-fullscreen'; readonly error: Error };

/** The `status` discriminant of an {@link OrientationLockResult}. */
export type OrientationLockStatus = OrientationLockResult['status'];

/** `ScreenOrientation.lock`, as the platform exposes it. */
type OrientationLockCall = (this: unknown, orientation: string) => Promise<void>;

/** `ScreenOrientation.unlock`, as the platform exposes it — synchronous and void, unlike `lock`. */
type OrientationUnlockCall = (this: unknown) => void;

/** Matches how browsers word the fullscreen precondition, which they report with varying error names. */
const FullscreenRequirementPattern = /fullscreen/i;

/** The reported orientations, for validating whatever the platform actually puts in `screen.orientation.type`. */
const KnownOrientationTypes: readonly string[] = Object.values(ScreenOrientationType);

/** The `screen.orientation` object, or `undefined` where the API is absent (older iOS, SSR). */
function getScreenOrientation(): unknown {
  return readMember(getScreen(), 'orientation');
}

/** Whether `value` is one of the four orientations the platform is specified to report. */
function isOrientationType(value: unknown): value is ScreenOrientationType {
  return typeof value === 'string' && KnownOrientationTypes.includes(value);
}

/** Sorts a rejected `lock()` into the vocabulary — see this file's header on why fullscreen gets its own leg. */
function classifyOrientationRejection(cause: unknown): Exclude<OrientationLockResult, { status: 'ok' }> {
  const error = toError(cause);

  // Checked before the name: browsers disagree on the type here (`SecurityError`, `NotSupportedError`, a bare
  // `DOMException`) but all of them say "fullscreen" in the message.
  if (FullscreenRequirementPattern.test(error.message)) return { status: 'requires-fullscreen', error };
  if (error.name === 'SecurityError') return { status: 'requires-fullscreen', error };
  // The device cannot lock at all — desktop Chromium's answer. `unsupported` carries no error by contract.
  if (error.name === 'NotSupportedError') return { status: 'unsupported' };
  if (error.name === 'NotAllowedError') return { status: 'denied', error };

  return { status: 'failed', error };
}

/**
 * The current device orientation, or `null` when it cannot be determined — SSR, or a browser without
 * `screen.orientation` (iOS before 16.4).
 *
 * A point-in-time read; `useOrientation` is the reactive form. An unrecognized value from the platform reads as
 * `null` rather than being passed through, so the return type is honest.
 *
 * @returns The current {@link ScreenOrientationType}, or `null`.
 */
export function getOrientation(): ScreenOrientationType | null {
  const type = readMember(getScreenOrientation(), 'type');
  return isOrientationType(type) ? type : null;
}

/**
 * The current orientation angle in degrees (`0`, `90`, `180`, `270`), or `null` when unavailable.
 *
 * Relative to the device's natural orientation, so `0` is portrait on a phone and landscape on many tablets —
 * never infer a shape from the angle alone. Pair it with {@link getOrientation}.
 *
 * @returns The angle, or `null`.
 */
export function getOrientationAngle(): number | null {
  const angle = readMember(getScreenOrientation(), 'angle');
  return typeof angle === 'number' && Number.isFinite(angle) ? angle : null;
}

/**
 * Whether orientation locking is present at all.
 *
 * `true` says the method exists, not that it will succeed — a lock outside fullscreen still fails on the devices
 * that have it. `false` under SSR, on desktop Safari, and on iOS.
 *
 * @returns `true` when a lock could be attempted.
 */
export function isOrientationLockSupported(): boolean {
  return isFunction(readMember(getScreenOrientation(), 'lock'));
}

/**
 * Asks the device to hold `orientation`.
 *
 * ENTER FULLSCREEN FIRST. Mobile browsers require it, and a call from a normal page resolves to
 * `requires-fullscreen` — a distinct status precisely because it is fixable, unlike `unsupported`. Desktop
 * browsers and Safari resolve to `unsupported` no matter what you do.
 *
 * Never throws, never rejects.
 *
 * @param orientation The lock target — a concrete orientation, or a relative one like `natural`.
 * @returns `ok` once the device honours the lock, or the classified failure.
 */
export async function lockOrientation(orientation: ScreenOrientationLock): Promise<OrientationLockResult> {
  const screenOrientation = getScreenOrientation();

  const lock = readMember(screenOrientation, 'lock') as OrientationLockCall | undefined;
  if (!isFunction(lock) || lock === undefined) return { status: 'unsupported' };

  try {
    await lock.call(screenOrientation, orientation);
    return { status: 'ok' };
  } catch (error) {
    return classifyOrientationRejection(error);
  }
}

/**
 * Releases any orientation lock, letting the device rotate freely again.
 *
 * Synchronous, unlike {@link lockOrientation} — the platform's `unlock()` returns nothing and takes effect
 * immediately. Safe to call when no lock is held. Resolves to `unsupported` rather than `ok` where the API is
 * absent, so "nothing to unlock" and "cannot unlock" stay distinguishable.
 *
 * Never throws.
 *
 * @returns `ok` when the lock was released, `unsupported` where the API is absent, `failed` on a throw.
 */
export function unlockOrientation(): ScreenResult {
  const screenOrientation = getScreenOrientation();

  const unlock = readMember(screenOrientation, 'unlock') as OrientationUnlockCall | undefined;
  if (!isFunction(unlock) || unlock === undefined) return { status: 'unsupported' };

  try {
    unlock.call(screenOrientation);
    return { status: 'ok' };
  } catch (error) {
    // `unlock()` has no fullscreen precondition, so the widened leg cannot apply here — a throw is a plain failure.
    return { status: 'failed', error: toError(error) };
  }
}

/**
 * Subscribes `listener` to orientation changes, returning an unsubscribe.
 *
 * Returns a no-op unsubscribe where the API is absent, so a caller never branches on the environment.
 *
 * @param listener Invoked after every orientation change.
 * @returns A function that removes the listener.
 */
export function onOrientationChange(listener: () => void): () => void {
  const screenOrientation = getScreenOrientation();

  const target = screenOrientation as EventTarget | undefined;
  if (target === undefined || !isFunction(readMember(target, 'addEventListener'))) {
    return () => {
      // No orientation API to unsubscribe from. A no-op keeps the caller's teardown path uniform.
    };
  }

  const handler = (): void => {
    listener();
  };

  target.addEventListener('change', handler);

  return () => {
    target.removeEventListener('change', handler);
  };
}
