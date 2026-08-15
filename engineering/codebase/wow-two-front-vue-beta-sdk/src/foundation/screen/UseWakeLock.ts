// The Vue binding of the wake-lock vector. Deliberately thin: `holdWakeLock` owns the request cycle, the
// visibility re-acquire, and the teardown, so this file is only the watcher that starts one and the state that
// renders from it. Everything worth testing lives one layer down, in node.
//
// THE TEARDOWN RELEASE IS NOT OPTIONAL. A wake lock outlives the component that took it — nothing in the platform
// ties it to a component tree. Leak one and the user's screen stays awake after they have navigated away from the
// recipe, the workout, the boarding pass; on a phone that is a visible battery cost with no visible cause. So
// every path releases: scope disposal, an `active` flip, and a re-run of the watcher.
//
// STARTED FROM `onMounted` PLUS A NON-IMMEDIATE WATCHER, never an immediate one. `holdWakeLock` reads
// `navigator.wakeLock` and attaches a `visibilitychange` listener to `document`; an immediate watcher also runs
// during a server render, where neither exists. `onMounted` covers the initial state, the watcher covers every
// later flip, and both funnel through the same `apply` so `active: true → false` releases through exactly the
// same code path as a disposal, with no second teardown to keep in sync.

import { onMounted, onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from 'vue';

import { holdWakeLock, IdleWakeLockState } from './WakeLock';
import type { WakeLockHold, WakeLockKind, WakeLockState } from './WakeLock';

/**
 * Holds a screen wake lock for as long as `active` resolves to `true`, re-acquiring it after every visibility
 * change.
 *
 * Drive it from whatever state means "the user is watching": a running timer, a playing video, an open recipe.
 * Flipping `active` to `false` releases; so does disposing the scope. The lock is re-acquired automatically when
 * the page returns to visible, which is the behaviour a raw `navigator.wakeLock.request` does not give you.
 *
 * Holds a defined `idle` state under SSR and on browsers without the API — check `status === 'unsupported'`
 * before offering a "keep screen awake" control.
 *
 * @param active Whether the lock should be held. A ref or getter is how it flips.
 * @param type The kind of lock. Defaults to `screen`. Changing it re-acquires.
 * @returns The current {@link WakeLockState}.
 */
export function useWakeLock(
  active: MaybeRefOrGetter<boolean>,
  type?: MaybeRefOrGetter<WakeLockKind | undefined>,
): Readonly<ShallowRef<WakeLockState>> {
  const state = shallowRef<WakeLockState>(IdleWakeLockState);

  let hold: WakeLockHold | null = null;

  function release(): void {
    hold?.release();
    hold = null;
    // The shared constant is load-bearing: a stable identity means an already-idle state does not wake watchers.
    state.value = IdleWakeLockState;
  }

  function apply(): void {
    release();
    if (!toValue(active)) return;
    hold = holdWakeLock({
      type: toValue(type),
      onChange: (next) => {
        state.value = next;
      },
    });
  }

  onMounted(apply);
  // Non-immediate on purpose: an immediate watcher runs on the server, where `navigator` and `document` are
  // absent. Two getters, so Vue compares each with `Object.is` and only a genuine change re-acquires.
  watch([() => toValue(active), () => toValue(type)], apply);
  onScopeDispose(release);

  return state;
}
