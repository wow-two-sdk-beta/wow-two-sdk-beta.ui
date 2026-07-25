// The Screen Wake Lock API — keeping the display awake — in two layers: `requestWakeLock` for one lock, and
// `holdWakeLock` for a lock that STAYS held.
//
// THE WHOLE DIFFICULTY OF THIS API: the platform releases the lock the moment the page stops being visible, and
// it does not give it back. Switch tabs, answer a call, let the phone lock — the sentinel is released and every
// later read of it says so. Nothing re-acquires on return. A recipe app that requests a lock on mount and calls
// it done therefore works exactly until the user glances at a message, after which the screen sleeps mid-recipe
// and the feature silently no longer exists. That is the bug this module is written to prevent, and it is why
// `holdWakeLock` — not `requestWakeLock` — is what a consumer normally wants.
//
// So `holdWakeLock` subscribes to `visibilitychange` and re-requests when the page comes back visible and the
// caller still wants the lock. Re-acquiring is guarded three ways: not when disposed, not when a request is
// already in flight (visibility can flap faster than the request settles), and not when the current handle is
// still live (a `visible` → `visible` notification must not stack a second lock).
//
// WHY THIS IS NOT A HOOK. The re-acquire cycle is the part most worth testing, and as a hook it would only be
// testable through a renderer — with the timing of an effect, an act() boundary, and a fake `document` layered
// on top of the behaviour under test. As a plain function it is directly testable in node, and `useWakeLock`
// becomes a thin binding with nothing of its own to get wrong. The same split `foundation/share` makes between
// `share` and `useShare`.
//
// `denied` covers both of the spec's `NotAllowedError` cases — a permissions-policy block and a document that is
// not visible — because they are the same answer to the consumer: the platform said no to this request, and
// repeating it right now changes nothing.

import { toError } from '../errors';

import { getDocument, getNavigator, isFunction, readMember } from './ScreenEnvironment';
import type { ScreenFailure, ScreenStatus, ScreenValueResult } from './ScreenResult';

/** The kinds of wake lock the platform defines. Only `screen` exists; the spec keeps the axis open. */
export const WakeLockKind = {
  /** Keeps the display on and undimmed. The only kind any browser implements today. */
  Screen: 'screen',
} as const;

/** One of the {@link WakeLockKind} values. */
export type WakeLockKind = (typeof WakeLockKind)[keyof typeof WakeLockKind];

/** `navigator.wakeLock.request`, as the platform exposes it. */
type WakeLockRequest = (this: unknown, type: string) => Promise<unknown>;

/** `WakeLockSentinel.release`, as the platform exposes it. */
type WakeLockRelease = (this: unknown) => Promise<void>;

/**
 * A held wake lock. Wraps the platform's `WakeLockSentinel` so that {@link WakeLockHandle.release} is total and
 * {@link WakeLockHandle.released} reads through to the live sentinel rather than a snapshot taken at request
 * time — the platform flips that flag on its own when the page is hidden.
 */
export interface WakeLockHandle {
  /** The kind of lock held. */
  readonly type: WakeLockKind;

  /** Whether the lock is no longer held — by an explicit release, or by the platform hiding the page. */
  readonly released: boolean;

  /** Releases the lock. Safe to call twice, and on an already-released lock. Never throws. */
  release: () => Promise<void>;
}

/** Where a {@link holdWakeLock} sits: `idle` before its first request settles, then the last request's status. */
export type WakeLockStatus = 'idle' | ScreenStatus;

/** The observable state of a {@link WakeLockHold}. */
export interface WakeLockState {
  /** Whether a lock is held right now. Drops to `false` when the page is hidden, back to `true` on return. */
  readonly held: boolean;

  /** The status of the most recent request, or `idle` before the first one settles. */
  readonly status: WakeLockStatus;

  /** The error from the most recent non-`ok` request, or `null`. Always `null` for `unsupported`. */
  readonly error: Error | null;
}

/** Tunes a {@link holdWakeLock}. */
export interface WakeLockHoldOptions {
  /** The kind of lock to hold. Defaults to `screen`, the only kind implemented. */
  readonly type?: WakeLockKind;

  /** Called on every state transition — the seam `useWakeLock` renders from. A throw from it is swallowed. */
  readonly onChange?: (state: WakeLockState) => void;
}

/** A wake lock held across visibility changes until released. */
export interface WakeLockHold {
  /** The current state. Re-read it after an `onChange`; it is not reactive on its own. */
  readonly state: WakeLockState;

  /** Stops re-acquiring, unsubscribes, and releases any held lock. Idempotent. */
  release: () => void;
}

/**
 * The state before any request has settled. A module constant, not a fresh literal: `useWakeLock` resets to it on
 * every inactive render, and only a stable identity lets React bail out instead of re-rendering forever.
 */
export const IdleWakeLockState: WakeLockState = { held: false, status: 'idle', error: null };

/** Sorts a rejected wake-lock request into the slice's vocabulary — see this file's header on `denied`. */
function classifyWakeLockRejection(cause: unknown): ScreenFailure {
  const error = toError(cause);

  if (error.name === 'NotAllowedError') return { status: 'denied', error };

  return { status: 'failed', error };
}

/** Wraps a platform sentinel so `release` cannot throw and `released` stays live. */
function toWakeLockHandle(sentinel: unknown, type: WakeLockKind): WakeLockHandle {
  return {
    type,

    get released(): boolean {
      // Read through on every access — the platform flips this when it takes the lock back.
      return readMember(sentinel, 'released') === true;
    },

    release: async (): Promise<void> => {
      const release = readMember(sentinel, 'release') as WakeLockRelease | undefined;
      if (!isFunction(release) || release === undefined) return;

      try {
        await release.call(sentinel);
      } catch {
        // Already released, or the sentinel was detached with the document. Either way the lock is gone, which
        // is what the caller asked for — there is nothing to recover or report.
      }
    },
  };
}

/**
 * Requests a single wake lock.
 *
 * The lock this yields is released by the platform as soon as the page is hidden and is NOT restored on return —
 * prefer {@link holdWakeLock} unless you genuinely want one attempt. Must be called from an active, visible
 * document; a hidden one is rejected as `denied`.
 *
 * Never throws, never rejects.
 *
 * @param type The kind of lock. Defaults to `screen`.
 * @returns `ok` with the handle, or the classified failure.
 */
export async function requestWakeLock(
  type: WakeLockKind = WakeLockKind.Screen,
): Promise<ScreenValueResult<WakeLockHandle>> {
  const nav = getNavigator();
  if (nav === undefined) return { status: 'unsupported' };

  const wakeLock = readMember(nav, 'wakeLock');
  const request = readMember(wakeLock, 'request') as WakeLockRequest | undefined;
  if (!isFunction(request) || request === undefined) return { status: 'unsupported' };

  try {
    const sentinel = await request.call(wakeLock, type);
    return { status: 'ok', value: toWakeLockHandle(sentinel, type) };
  } catch (error) {
    return classifyWakeLockRejection(error);
  }
}

/**
 * Holds a wake lock, re-acquiring it whenever the page returns to visible.
 *
 * This is the form a consumer normally wants: the platform drops the lock on every tab switch, notification, and
 * screen blank, and without the re-acquire the feature quietly stops working after the first one. Starts
 * requesting immediately and reports each transition through `options.onChange`.
 *
 * Call {@link WakeLockHold.release} when done — nothing else ends the cycle.
 *
 * Never throws.
 *
 * @param options The lock kind and the state-change callback.
 * @returns The live hold.
 */
export function holdWakeLock(options?: WakeLockHoldOptions): WakeLockHold {
  const type = options?.type ?? WakeLockKind.Screen;

  let state: WakeLockState = IdleWakeLockState;
  let handle: WakeLockHandle | null = null;
  let disposed = false;
  let acquiring = false;

  const publish = (next: WakeLockState): void => {
    state = next;

    const onChange = options?.onChange;
    if (onChange === undefined) return;

    try {
      onChange(next);
    } catch {
      // The consumer's own listener failed. The hold is unaffected and keeps its lock — swallowing here is the
      // same posture `foundation/share` takes with a throwing `onError`.
    }
  };

  const acquire = async (): Promise<void> => {
    if (disposed || acquiring) return;
    // Still holding a live lock — a `visible` → `visible` notification must not stack a second one.
    if (handle !== null && !handle.released) return;

    acquiring = true;
    try {
      const result = await requestWakeLock(type);

      if (disposed) {
        // Released while the request was in flight. Nothing is watching the state any more, but the lock itself
        // is real and would otherwise outlive the hold that owns it.
        if (result.status === 'ok') void result.value.release();
        return;
      }

      if (result.status === 'ok') {
        handle = result.value;
        publish({ held: true, status: 'ok', error: null });
        return;
      }

      handle = null;
      publish({
        held: false,
        status: result.status,
        error: result.status === 'unsupported' ? null : result.error,
      });
    } finally {
      acquiring = false;
    }
  };

  const onVisibilityChange = (): void => {
    if (disposed) return;

    const doc = getDocument();
    if (doc === undefined) return;

    if (readMember(doc, 'visibilityState') === 'visible') {
      void acquire();
      return;
    }

    // Hidden: the platform has already taken the lock back without telling us. Drop the handle so the next
    // `visible` re-requests, and report the loss so a consumer's indicator does not keep claiming it is held.
    handle = null;
    if (state.held) publish({ held: false, status: state.status, error: state.error });
  };

  const doc = getDocument();
  const listening = doc !== undefined && isFunction(readMember(doc, 'addEventListener'));
  if (listening && doc !== undefined) doc.addEventListener('visibilitychange', onVisibilityChange);

  void acquire();

  return {
    get state(): WakeLockState {
      return state;
    },

    release: (): void => {
      if (disposed) return;
      disposed = true;

      if (listening && doc !== undefined) doc.removeEventListener('visibilitychange', onVisibilityChange);

      const current = handle;
      handle = null;
      if (current !== null) void current.release();

      // State is reset WITHOUT publishing. `release` runs from a React cleanup, and calling back into a consumer
      // that is unmounting buys nothing — `useWakeLock` resets its own state on the same path.
      state = IdleWakeLockState;
    },
  };
}
