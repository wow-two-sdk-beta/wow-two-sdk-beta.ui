// The Vue binding of the orientation vector — reactive orientation plus the two actions, so a component does
// not pair a ref with a `screen.orientation` subscription by hand.
//
// Reads go through one subscription for the same reason `useFullscreen`'s do: the device rotates without asking
// this app, so re-reading the platform's own value on every notification is the only correct answer. The three
// values are separate `shallowRef`s rather than one snapshot object — the original had to split them because
// `useSyncExternalStore` loops on a fresh object identity, and keeping them split here preserves that the two
// primitives update independently.
//
// SEEDED, NOT READ AT SETUP: `getOrientation`, `getOrientationAngle`, and `isOrientationLockSupported` all read
// `screen`, which does not exist on the server. `onMounted` is client-only, so SSR gets a defined `null` / `null`
// / `false` and the truth arrives at hydration with no mismatch.

import { onMounted, onScopeDispose, shallowRef, type ShallowRef } from 'vue';

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
  readonly orientation: Readonly<ShallowRef<ScreenOrientationType | null>>;

  /** The current angle in degrees relative to the device's natural orientation, or `null` when unavailable. */
  readonly angle: Readonly<ShallowRef<number | null>>;

  /** Whether locking is present. `false` under SSR, on desktop, and on Safari — hide the control when `false`. */
  readonly supported: Readonly<ShallowRef<boolean>>;

  /** Asks the device to hold an orientation. Enter fullscreen first. Resolves to the result; never throws. */
  readonly lock: (orientation: ScreenOrientationLock) => Promise<OrientationLockResult>;

  /** Releases the lock. Synchronous, like the platform's own `unlock()`. Never throws. */
  readonly unlock: () => ScreenResult;
}

/**
 * Tracks the device orientation and exposes the lock actions.
 *
 * Use the reported orientation to adapt a layout only where a CSS media query genuinely cannot — the query is
 * cheaper and needs no JavaScript. The real reason to reach for this composable is `lock` / `unlock`, which have
 * no CSS equivalent.
 *
 * Inherits the module's never-throws contract.
 *
 * @returns The current orientation and angle plus the `lock` / `unlock` actions.
 */
export function useOrientation(): OrientationControls {
  const orientation = shallowRef<ScreenOrientationType | null>(null);
  const angle = shallowRef<number | null>(null);
  const supported = shallowRef(false);

  let unsubscribe: (() => void) | undefined;

  onMounted(() => {
    const sync = (): void => {
      orientation.value = getOrientation();
      angle.value = getOrientationAngle();
      supported.value = isOrientationLockSupported();
    };
    sync();
    unsubscribe = onOrientationChange(sync);
  });

  onScopeDispose(() => {
    unsubscribe?.();
    unsubscribe = undefined;
  });

  const lock = (target: ScreenOrientationLock): Promise<OrientationLockResult> => lockOrientation(target);
  const unlock = (): ScreenResult => unlockOrientation();

  return { orientation, angle, supported, lock, unlock };
}
