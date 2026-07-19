// The React binding of the share vector — a thin state machine over `share` / `shareOrCopy`, so a share button
// can render a pending state and a post-action confirmation without every consumer re-declaring the same two
// `useState`s. No behaviour of its own: both callbacks delegate, so the never-throws contract holds unchanged
// and every outcome arrives as a `ShareOrCopyResult` on `result`.
//
// Options are read from a ref, so passing a fresh `{ onError }` literal each render does not churn the callback
// identities — the same shape `foundation/shortcuts`' `useHotkeys` uses.
//
// The pending flag is cleared in a `finally`. The delegates are contractually throw-free, but a state machine
// that can strand itself at `sharing` would disable the button forever, so the reset does not depend on that
// contract holding.

import { useCallback, useRef, useState } from 'react';

import { share, type ShareResult } from './Share';
import { shareOrCopy, type ShareOrCopyOptions, type ShareOrCopyResult } from './ShareOrCopy';
import type { ShareData } from './ShareData';

/** Where a `useShare` instance sits in its cycle: idle, or awaiting the native sheet / clipboard write. */
export type ShareState = 'idle' | 'sharing';

/** What {@link useShare} returns. */
export interface ShareControls {
  /** `sharing` while an attempt is in flight, `idle` otherwise. */
  readonly state: ShareState;

  /** Convenience for `state === 'sharing'` — the flag a button's `disabled` / spinner wants. */
  readonly sharing: boolean;

  /** The most recent outcome, or `null` before the first attempt and after {@link ShareControls.reset}. */
  readonly result: ShareOrCopyResult | null;

  /** Whether the last attempt ended in a clipboard copy — the cue for a "Link copied" confirmation. */
  readonly copied: boolean;

  /** Opens the native sheet with no fallback. Resolves to the result; never throws. */
  readonly share: (data: ShareData) => Promise<ShareResult>;

  /** Opens the native sheet, degrading to a clipboard copy when unsupported. Resolves to the result; never throws. */
  readonly shareOrCopy: (data: ShareData) => Promise<ShareOrCopyResult>;

  /** Clears `result` and returns `state` to `idle`. */
  readonly reset: () => void;
}

/**
 * Wraps the share vector in a `idle` / `sharing` + last-result state machine. Both returned callbacks are stable
 * across renders and inherit the module's never-throws contract — a rejected promise is not one of the outcomes.
 */
export function useShare(options?: ShareOrCopyOptions): ShareControls {
  const [state, setState] = useState<ShareState>('idle');
  const [result, setResult] = useState<ShareOrCopyResult | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  /** Runs one attempt, bracketing it with the pending flag and recording the outcome. */
  const run = useCallback(
    async <TResult extends ShareOrCopyResult>(attempt: () => Promise<TResult>): Promise<TResult> => {
      setState('sharing');
      try {
        const outcome = await attempt();
        setResult(outcome);
        return outcome;
      } finally {
        setState('idle');
      }
    },
    [],
  );

  const runShare = useCallback((data: ShareData) => run(() => share(data, optionsRef.current)), [run]);

  const runShareOrCopy = useCallback((data: ShareData) => run(() => shareOrCopy(data, optionsRef.current)), [run]);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
  }, []);

  return {
    state,
    sharing: state === 'sharing',
    result,
    copied: result?.status === 'copied',
    share: runShare,
    shareOrCopy: runShareOrCopy,
    reset,
  };
}
