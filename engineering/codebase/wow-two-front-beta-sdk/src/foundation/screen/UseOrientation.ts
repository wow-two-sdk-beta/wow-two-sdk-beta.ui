// The React binding of the orientation vector — reactive orientation plus the two actions, so a component does
// not pair a `useState` with a `screen.orientation` subscription by hand.
//
// Reads go through `useSyncExternalStore` for the same reason `useFullscreen`'s do: the device rotates without
// asking this app, so the platform's own value on every notification is the only correct answer, and SSR gets a
// defined `null` with no hydration mismatch. Two stores share one `subscribe` because `orientation` and `angle`
// are separate primitives and a single snapshot object would allocate a new identity on every read, which
// `useSyncExternalStore` treats as a change and loops on.

import { useCallback, useSyncExternalStore } from 'react';

import {
  getOrientation,
  getOrientationAngle,
  isOrientationLockSupported,
  lockOrientation,
  onOrientationChange,
  unlockOrientation,
} from './ScreenOrientation';
import type { OrientationLockResult, ScreenOrientationLock, ScreenOrientationType } from './ScreenOrientation';
import type { ScreenResult } from './ScreenResult';

/** What {@link useOrientation} returns. */
export interface OrientationControls {
  /** The current device orientation, or `null` under SSR and where `screen.orientation` is absent. */
  readonly orientation: ScreenOrientationType | null;

  /** The current angle in degrees relative to the device's natural orientation, or `null` when unavailable. */
  readonly angle: number | null;

  /** Whether locking is present. `false` under SSR, on desktop, and on Safari — hide the control when `false`. */
  readonly supported: boolean;

  /** Asks the device to hold an orientation. Enter fullscreen first. Resolves to the result; never throws. */
  readonly lock: (orientation: ScreenOrientationLock) => Promise<OrientationLockResult>;

  /** Releases the lock. Synchronous, like the platform's own `unlock()`. Never throws. */
  readonly unlock: () => ScreenResult;
}

/** SSR knows no orientation — a defined `null`, never a throw. */
function getServerOrientation(): null {
  return null;
}

/** SSR cannot lock. */
function getServerSupported(): boolean {
  return false;
}

/**
 * Tracks the device orientation and exposes the lock actions.
 *
 * Use the reported orientation to adapt a layout only where a CSS media query genuinely cannot — the query is
 * cheaper and needs no JavaScript. The real reason to reach for this hook is `lock` / `unlock`, which have no CSS
 * equivalent.
 *
 * The returned callbacks are stable across renders and inherit the module's never-throws contract.
 *
 * @returns The current orientation and angle plus the `lock` / `unlock` actions.
 */
export function useOrientation(): OrientationControls {
  const subscribe = useCallback((onStoreChange: () => void) => onOrientationChange(onStoreChange), []);

  const orientation = useSyncExternalStore(subscribe, getOrientation, getServerOrientation);
  const angle = useSyncExternalStore(subscribe, getOrientationAngle, getServerOrientation);
  const supported = useSyncExternalStore(subscribe, isOrientationLockSupported, getServerSupported);

  const lock = useCallback((target: ScreenOrientationLock) => lockOrientation(target), []);
  const unlock = useCallback(() => unlockOrientation(), []);

  return { orientation, angle, supported, lock, unlock };
}
