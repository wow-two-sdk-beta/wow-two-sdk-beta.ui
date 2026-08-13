// The Vue binding of the write path — the transient "Copied!" affordance, without hiding the outcome.
//
// THE DIFFERENCE FROM `foundation/hooks`' `useClipboard`: that composable's `copy` resolves `Promise<void>` on
// both success and failure, folding the error into reactive state. A caller cannot branch on the outcome, and
// anything that is not a component cannot see it at all. Here `copy` resolves to the same
// `ClipboardWriteResult` the framework-free `copyText` returns, so the awaiting code can branch AND the
// rendered `status` still drives the icon swap. State is the affordance; the result is the answer. Neither
// replaces the other.
//
// `status` carries the failure statuses too, not just `copied`. A copy that came back `denied` needs its own
// rendering — "Press Ctrl+C to copy" beside a still-selectable field — and a composable that exposed only a
// boolean would force the consumer to keep a parallel error state, which is the flaw above in a different shape.
//
// The auto-reset applies to EVERY terminal status, not only `copied`: a stuck error badge is as wrong as a stuck
// "Copied!". A consumer that wants a sticky failure passes `resetAfterMs: 0` and calls `reset` itself.
//
// The timer is cleared on scope disposal, and a `disposed` flag gates the post-await state write. The `await`
// can outlive the component — a user copying and immediately closing the dialog — and scheduling a timeout from
// a callback whose scope is gone would leave a timer with nothing to update.
//
// Nothing here touches a platform global at setup: `copyText` is only reached from a user gesture.

import { onScopeDispose, shallowRef, toValue, type MaybeRefOrGetter, type ShallowRef } from 'vue';

import type { ClipboardCopyOptions, ClipboardWriteResult, ClipboardWriteStatus } from './ClipboardResult';
import { copyText } from './CopyText';

/** How long a status lingers before the composable returns to `idle`, when the caller does not say. */
const DefaultResetAfterMs = 2000;

/** Where a {@link useClipboardCopy} instance sits: `idle` before the first attempt, otherwise the last outcome. */
export type ClipboardCopyState = 'idle' | ClipboardWriteStatus;

/** Tunes a {@link useClipboardCopy} instance. */
export interface UseClipboardCopyOptions extends ClipboardCopyOptions {
  /**
   * How long `status` holds the last outcome before returning to `idle`, in milliseconds. Defaults to 2000 —
   * long enough to read "Copied!", short enough not to linger.
   *
   * Pass `0` to hold the status until {@link ClipboardCopyControls.reset} is called, which is what a failure
   * message the user must acknowledge wants.
   */
  readonly resetAfterMs?: number;
}

/** What {@link useClipboardCopy} returns. */
export interface ClipboardCopyControls {
  /**
   * The last outcome, or `idle` before the first attempt and after the reset window. Drives the icon swap, the
   * "Copied!" label, and the `denied` / `unsupported` fallback copy.
   */
  readonly status: Readonly<ShallowRef<ClipboardCopyState>>;

  /**
   * Writes `text` to the clipboard and resolves to the full result — the awaiting caller branches on the
   * outcome, while `status` drives the render. Never throws, never rejects.
   */
  readonly copy: (text: string) => Promise<ClipboardWriteResult>;

  /** Returns `status` to `idle` immediately and cancels the pending auto-reset. */
  readonly reset: () => void;
}

/**
 * Wraps `copyText` in a transient status for post-action UI, without swallowing the outcome.
 *
 * Call `copy` from a user gesture — the platform requires transient activation, and a copy fired from a watcher
 * or a timeout comes back `denied`.
 *
 * @param options Error reporting, the legacy-fallback opt-in, and the auto-reset window. Read fresh on every
 *   call, so a ref or getter keeps them live.
 */
export function useClipboardCopy(
  options?: MaybeRefOrGetter<UseClipboardCopyOptions | undefined>,
): ClipboardCopyControls {
  const status = shallowRef<ClipboardCopyState>('idle');

  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  /** Cancels a pending auto-reset. Safe to call when none is scheduled. */
  function clearTimer(): void {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
  }

  onScopeDispose(() => {
    disposed = true;
    clearTimer();
  });

  const copy = async (text: string): Promise<ClipboardWriteResult> => {
    const result = await copyText(text, toValue(options));

    // The scope may have been disposed while the write was in flight. The RESULT still goes back to the
    // caller — it is the answer to their call, not a piece of this component's state.
    if (disposed) return result;

    clearTimer();
    status.value = result.status;

    const resetAfterMs = toValue(options)?.resetAfterMs ?? DefaultResetAfterMs;
    if (resetAfterMs > 0) {
      timer = setTimeout(() => {
        timer = null;
        status.value = 'idle';
      }, resetAfterMs);
    }

    return result;
  };

  const reset = (): void => {
    clearTimer();
    status.value = 'idle';
  };

  return { status, copy, reset };
}
