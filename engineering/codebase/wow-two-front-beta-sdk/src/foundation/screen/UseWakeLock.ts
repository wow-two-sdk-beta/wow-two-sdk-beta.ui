// The React binding of the wake-lock vector. Deliberately thin: `holdWakeLock` owns the request cycle, the
// visibility re-acquire, and the teardown, so this file is only the effect that starts one and the state that
// renders from it. Everything worth testing lives one layer down, in node.
//
// THE UNMOUNT RELEASE IS NOT OPTIONAL. A wake lock outlives the component that took it — nothing in the platform
// ties it to a React tree. Leak one and the user's screen stays awake after they have navigated away from the
// recipe, the workout, the boarding pass; on a phone that is a visible battery cost with no visible cause. So
// the effect's cleanup always releases, on every path: unmount, an `active` flip, and a Strict Mode double-mount.
//
// `active` as a dependency rather than a branch inside the effect is what makes the flip work: React runs the
// cleanup for the previous value before the next effect, so `active: true → false` releases through exactly the
// same code path as an unmount, with no second teardown to keep in sync.

import { useEffect, useState } from 'react';

import { holdWakeLock, IdleWakeLockState } from './WakeLock';
import type { WakeLockKind, WakeLockState } from './WakeLock';

/**
 * Holds a screen wake lock for as long as `active` is `true`, re-acquiring it after every visibility change.
 *
 * Drive it from whatever state means "the user is watching": a running timer, a playing video, an open recipe.
 * Flipping `active` to `false` releases; so does unmounting. The lock is re-acquired automatically when the page
 * returns to visible, which is the behaviour a raw `navigator.wakeLock.request` does not give you.
 *
 * Renders a defined `idle` state under SSR and on browsers without the API — check `status === 'unsupported'`
 * before offering a "keep screen awake" control.
 *
 * @param active Whether the lock should be held.
 * @param type The kind of lock. Defaults to `screen`.
 * @returns The current {@link WakeLockState}.
 */
export function useWakeLock(active: boolean, type?: WakeLockKind): WakeLockState {
  const [state, setState] = useState<WakeLockState>(IdleWakeLockState);

  useEffect(() => {
    if (!active) {
      // The shared constant is load-bearing: React bails out on an identical value, so this cannot loop.
      setState(IdleWakeLockState);
      return;
    }

    const hold = holdWakeLock({ type, onChange: setState });

    return () => {
      hold.release();
      setState(IdleWakeLockState);
    };
  }, [active, type]);

  return state;
}
