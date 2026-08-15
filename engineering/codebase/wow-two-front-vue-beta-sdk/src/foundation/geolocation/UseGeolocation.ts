// The Vue binding of the one-shot read — the position as reactive state, plus the one action that fetches it,
// so a "Use my location" button is a `status` switch and a `request()` call rather than four refs re-declared
// per consumer.
//
// NOTHING HAPPENS ON MOUNT, ON PURPOSE. This composable does not request a position when it mounts. The first
// request raises the browser's permission prompt, and a prompt that appears on page load — with no visible
// cause the user can connect it to — is the one users reflexively dismiss, which records a `denied` that sticks
// for the origin and cannot be undone from script. So the request is always the consumer's explicit act,
// ideally inside a click handler. Mount-time tracking is what `useWatchPosition` is for, and it is opt-in by
// being a different composable. It is also why nothing here touches `navigator` at setup time: the SSR pass
// runs this file, and only `request()` — which can only be called from the client — reaches the platform.
//
// STALE RESPONSES LOSE. A double-clicked button, or a re-request while a slow cold GPS fix is still resolving,
// leaves two requests in flight. Without a guard the SLOWER one wins simply by finishing last, so a fresh
// `denied` could be overwritten by a stale `ok` from before the user revoked. A monotonic token means only the
// most recent request may write state; the earlier promise still resolves to its own result for whoever awaited
// it, which keeps `request()`'s return value honest per call.
//
// Options are accepted as a ref or getter and read through `toValue` at call time, so a reactive source is
// followed without the composable ever caching a stale copy — the Vue counterpart of the original's
// options-in-a-ref indirection. A per-call argument overrides them, for the "retry with a bigger timeout" path.

import { computed, shallowRef, toValue, type ComputedRef, type MaybeRefOrGetter, type ShallowRef } from 'vue';

import type { Position } from './Coordinates';
import { getCurrentPosition } from './GetCurrentPosition';
import {
  applyPositionResult,
  IdleGeolocationReading,
  type GeolocationReading,
  type GeolocationState,
} from './GeolocationReading';
import type { PositionRequestOptions, PositionResult } from './PositionResult';

/**
 * What {@link useGeolocation} returns — the reactive form of a {@link GeolocationReading} plus the action that
 * refreshes it.
 */
export interface GeolocationControls {
  /** The lifecycle state — drive the whole UI off this one switch. */
  readonly status: ComputedRef<GeolocationState>;

  /**
   * The most recent successful fix, or `null` before the first one. Deliberately NOT cleared by a later
   * failure — check `status.value === 'ok'` when only a currently-valid reading will do.
   */
  readonly position: ComputedRef<Position | null>;

  /** The error behind a `failed` status, or `null` for every other status. Never stale. */
  readonly error: ComputedRef<Error | null>;

  /** Convenience for `status === 'locating'` — the flag a button's `disabled` / spinner wants. */
  readonly locating: ComputedRef<boolean>;

  /**
   * Requests a fix, writing the outcome to this composable's state and also resolving to it. Never throws,
   * never rejects. Call it from a user gesture — it is what raises the permission prompt.
   *
   * @param overrides Options for this call only, replacing the composable-level ones. Omit to use those.
   */
  readonly request: (overrides?: PositionRequestOptions) => Promise<PositionResult>;
}

/**
 * Exposes the device's position as reactive state, with a `request()` that fetches it on demand.
 *
 * Requests nothing on mount — see the header for why that is deliberate. Inherits the slice's never-throws
 * contract: `request` resolves to a {@link PositionResult}, never rejects.
 *
 * @param options Default tuning for every `request()` call. A ref or getter is read at call time, so the value
 *   in effect is always the current one.
 */
export function useGeolocation(options?: MaybeRefOrGetter<PositionRequestOptions | undefined>): GeolocationControls {
  const reading: ShallowRef<GeolocationReading> = shallowRef(IdleGeolocationReading);

  /** Monotonic request token — only the newest request may write state. See the header. */
  let latestRequest = 0;

  const request = async (overrides?: PositionRequestOptions): Promise<PositionResult> => {
    latestRequest += 1;
    const token = latestRequest;

    reading.value = { ...reading.value, status: 'locating' };

    const result = await getCurrentPosition(overrides ?? toValue(options));

    if (token === latestRequest) reading.value = applyPositionResult(reading.value, result);
    return result;
  };

  return {
    status: computed(() => reading.value.status),
    position: computed(() => reading.value.position),
    error: computed(() => reading.value.error),
    locating: computed(() => reading.value.status === 'locating'),
    request,
  };
}
