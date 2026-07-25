// The React binding of the write path — the transient "Copied!" affordance, without hiding the outcome.
//
// THE DIFFERENCE FROM `foundation/hooks`' `useClipboard`: that hook's `copy` resolves `Promise<void>` on both
// success and failure, folding the error into React state. A caller cannot branch on the outcome, and anything
// that is not a component cannot see it at all. Here `copy` resolves to the same `ClipboardWriteResult` the
// non-React `copyText` returns, so the awaiting code can branch AND the rendered `status` still drives the icon
// swap. State is the affordance; the result is the answer. Neither replaces the other.
//
// `status` carries the failure statuses too, not just `copied`. A copy that came back `denied` needs its own
// rendering — "Press Ctrl+C to copy" beside a still-selectable field — and a hook that exposed only a boolean
// would force the consumer to keep a parallel error state, which is the flaw above in a different shape.
//
// The auto-reset applies to EVERY terminal status, not only `copied`: a stuck error badge is as wrong as a stuck
// "Copied!". A consumer that wants a sticky failure passes `resetAfterMs: 0` and calls `reset` itself.
//
// The timer is cleared on unmount, and `mountedRef` gates the post-await state write. The `await` can outlive the
// component — a user copying and immediately closing the dialog — and scheduling a timeout from a callback whose
// component is gone would leave a timer with nothing to update.

import { useCallback, useEffect, useRef, useState } from 'react';

import { copyText } from './CopyText';
import type { ClipboardCopyOptions, ClipboardWriteResult, ClipboardWriteStatus } from './ClipboardResult';

/** How long a status lingers before the hook returns to `idle`, when the caller does not say. */
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
  readonly status: ClipboardCopyState;

  /**
   * Writes `text` to the clipboard and resolves to the full result — the awaiting caller branches on the
   * outcome, while `status` drives the render. Stable across renders. Never throws, never rejects.
   */
  readonly copy: (text: string) => Promise<ClipboardWriteResult>;

  /** Returns `status` to `idle` immediately and cancels the pending auto-reset. */
  readonly reset: () => void;
}

/**
 * Wraps `copyText` in a transient status for post-action UI, without swallowing the outcome.
 *
 * Call `copy` from a user gesture — the platform requires transient activation, and a copy fired from an effect
 * or a timeout comes back `denied`.
 *
 * @param options Error reporting, the legacy-fallback opt-in, and the auto-reset window. Read fresh on every
 *   call, so a new object literal each render costs nothing.
 */
export function useClipboardCopy(options?: UseClipboardCopyOptions): ClipboardCopyControls {
  const resetAfterMs = options?.resetAfterMs ?? DefaultResetAfterMs;

  const [status, setStatus] = useState<ClipboardCopyState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  /** Cancels a pending auto-reset. Safe to call when none is scheduled. */
  const clearTimer = useCallback((): void => {
    if (timerRef.current === null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    // Set on mount rather than only at declaration: under StrictMode's double-invoke the same ref instance is
    // reused across the discarded first mount, which would otherwise leave this permanently false.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<ClipboardWriteResult> => {
      const result = await copyText(text, optionsRef.current);

      // The component may have unmounted while the write was in flight. The RESULT still goes back to the
      // caller — it is the answer to their call, not a piece of this component's state.
      if (!mountedRef.current) return result;

      clearTimer();
      setStatus(result.status);

      if (resetAfterMs > 0) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setStatus('idle');
        }, resetAfterMs);
      }

      return result;
    },
    [clearTimer, resetAfterMs],
  );

  const reset = useCallback((): void => {
    clearTimer();
    setStatus('idle');
  }, [clearTimer]);

  return { status, copy, reset };
}
