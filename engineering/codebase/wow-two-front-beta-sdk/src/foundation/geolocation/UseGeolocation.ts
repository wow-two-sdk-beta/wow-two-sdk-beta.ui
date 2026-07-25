// The React binding of the one-shot read — the position as render-time state, plus the one action that fetches
// it, so a "Use my location" button is a `status` switch and a `request()` call rather than four `useState`s
// re-declared per consumer.
//
// NOTHING HAPPENS ON MOUNT, ON PURPOSE. This hook does not request a position when it mounts. The first request
// raises the browser's permission prompt, and a prompt that appears on page load — with no visible cause the
// user can connect it to — is the one users reflexively dismiss, which records a `denied` that sticks for the
// origin and cannot be undone from script. So the request is always the consumer's explicit act, ideally inside
// a click handler. Mount-time tracking is what `useWatchPosition` is for, and it is opt-in by being a different
// hook.
//
// STALE RESPONSES LOSE. A double-clicked button, or a re-request while a slow cold GPS fix is still resolving,
// leaves two requests in flight. Without a guard the SLOWER one wins simply by finishing last, so a fresh
// `denied` could be overwritten by a stale `ok` from before the user revoked. A monotonic token means only the
// most recent request may write state; the earlier promise still resolves to its own result for whoever awaited
// it, which keeps `request()`'s return value honest per call.
//
// Options are read from a ref, so passing a fresh `{ timeout: 5000 }` literal each render does not churn the
// callback's identity — the same shape `foundation/share`'s `useShare` uses. A per-call argument overrides them,
// for the "retry with a bigger timeout" path.

import { useCallback, useRef, useState } from 'react';

import { getCurrentPosition } from './GetCurrentPosition';
import { applyPositionResult, IdleGeolocationReading, type GeolocationReading } from './GeolocationReading';
import type { PositionRequestOptions, PositionResult } from './PositionResult';

/** What {@link useGeolocation} returns — a {@link GeolocationReading} plus the action that refreshes it. */
export interface GeolocationControls extends GeolocationReading {
  /** Convenience for `status === 'locating'` — the flag a button's `disabled` / spinner wants. */
  readonly locating: boolean;

  /**
   * Requests a fix, writing the outcome to this hook's state and also resolving to it. Stable across renders;
   * never throws, never rejects. Call it from a user gesture — it is what raises the permission prompt.
   *
   * @param overrides Options for this call only, replacing the hook-level ones. Omit to use those.
   */
  readonly request: (overrides?: PositionRequestOptions) => Promise<PositionResult>;
}

/**
 * Exposes the device's position as state, with a `request()` that fetches it on demand.
 *
 * Requests nothing on mount — see the header for why that is deliberate. Inherits the slice's never-throws
 * contract: `request` resolves to a {@link PositionResult}, never rejects.
 *
 * @param options Default tuning for every `request()` call. Read from a ref, so a fresh object literal each
 *   render is fine; the value in effect is whatever was passed on the most recent render.
 */
export function useGeolocation(options?: PositionRequestOptions): GeolocationControls {
  const [reading, setReading] = useState<GeolocationReading>(IdleGeolocationReading);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  /** Monotonic request token — only the newest request may write state. See the header. */
  const latestRequestRef = useRef(0);

  const request = useCallback(async (overrides?: PositionRequestOptions): Promise<PositionResult> => {
    latestRequestRef.current += 1;
    const token = latestRequestRef.current;

    setReading((previous) => ({ ...previous, status: 'locating' }));

    const result = await getCurrentPosition(overrides ?? optionsRef.current);

    if (token === latestRequestRef.current) setReading((previous) => applyPositionResult(previous, result));
    return result;
  }, []);

  return {
    status: reading.status,
    position: reading.position,
    error: reading.error,
    locating: reading.status === 'locating',
    request,
  };
}
