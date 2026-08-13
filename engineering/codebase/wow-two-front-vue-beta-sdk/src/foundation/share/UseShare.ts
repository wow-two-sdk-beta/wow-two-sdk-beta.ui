// The Vue binding of the share vector — a thin state machine over `share` / `shareOrCopy`, so a share button
// can render a pending state and a post-action confirmation without every consumer re-declaring the same two
// refs. No behaviour of its own: both callbacks delegate, so the never-throws contract holds unchanged and
// every outcome arrives as a `ShareOrCopyResult` on `result`.
//
// Options are read through `toValue` at call time, so a reactive `onError` stays live — the same shape
// `foundation/shortcuts`' `useHotkeys` uses.
//
// Nothing here touches a platform global at setup: `share` and `shareOrCopy` are only reached from a user
// gesture, which is also what the Web Share API requires.
//
// The pending flag is cleared in a `finally`. The delegates are contractually throw-free, but a state machine
// that can strand itself at `sharing` would disable the button forever, so the reset does not depend on that
// contract holding.

import { computed, shallowRef, toValue, type ComputedRef, type MaybeRefOrGetter, type ShallowRef } from 'vue';

import { share, type ShareResult } from './Share';
import type { ShareData } from './ShareData';
import { shareOrCopy, type ShareOrCopyOptions, type ShareOrCopyResult } from './ShareOrCopy';

/** Where a `useShare` instance sits in its cycle: idle, or awaiting the native sheet / clipboard write. */
export type ShareState = 'idle' | 'sharing';

/** What {@link useShare} returns. */
export interface ShareControls {
  /** `sharing` while an attempt is in flight, `idle` otherwise. */
  readonly state: Readonly<ShallowRef<ShareState>>;

  /** Convenience for `state === 'sharing'` — the flag a button's `disabled` / spinner wants. */
  readonly sharing: ComputedRef<boolean>;

  /** The most recent outcome, or `null` before the first attempt and after {@link ShareControls.reset}. */
  readonly result: Readonly<ShallowRef<ShareOrCopyResult | null>>;

  /** Whether the last attempt ended in a clipboard copy — the cue for a "Link copied" confirmation. */
  readonly copied: ComputedRef<boolean>;

  /** Opens the native sheet with no fallback. Resolves to the result; never throws. */
  readonly share: (data: ShareData) => Promise<ShareResult>;

  /** Opens the native sheet, degrading to a clipboard copy when unsupported. Resolves to the result; never throws. */
  readonly shareOrCopy: (data: ShareData) => Promise<ShareOrCopyResult>;

  /** Clears `result` and returns `state` to `idle`. */
  readonly reset: () => void;
}

/**
 * Wraps the share vector in an `idle` / `sharing` + last-result state machine. Inherits the module's
 * never-throws contract — a rejected promise is not one of the outcomes.
 *
 * @param options Forwarded to `share` / `shareOrCopy`. A ref or getter is read at call time.
 */
export function useShare(options?: MaybeRefOrGetter<ShareOrCopyOptions | undefined>): ShareControls {
  const state = shallowRef<ShareState>('idle');
  const result = shallowRef<ShareOrCopyResult | null>(null);

  /** Runs one attempt, bracketing it with the pending flag and recording the outcome. */
  async function run<TResult extends ShareOrCopyResult>(attempt: () => Promise<TResult>): Promise<TResult> {
    state.value = 'sharing';
    try {
      const outcome = await attempt();
      result.value = outcome;
      return outcome;
    } finally {
      state.value = 'idle';
    }
  }

  const runShare = (data: ShareData): Promise<ShareResult> => run(() => share(data, toValue(options)));

  const runShareOrCopy = (data: ShareData): Promise<ShareOrCopyResult> =>
    run(() => shareOrCopy(data, toValue(options)));

  const reset = (): void => {
    state.value = 'idle';
    result.value = null;
  };

  return {
    state,
    sharing: computed(() => state.value === 'sharing'),
    result,
    copied: computed(() => result.value?.status === 'copied'),
    share: runShare,
    shareOrCopy: runShareOrCopy,
    reset,
  };
}
