// State that is LIVE-SHARED between open tabs and dies with the last one.
//
// PICKING BETWEEN THIS AND `usePersistentState` (`foundation/hooks`) — they overlap by one line in a table and
// differ everywhere else:
//
//   | | `usePersistentState` | `useBroadcastState` |
//   |---|---|---|
//   | Where the value lives | `localStorage` (durable) | memory, in each tab (ephemeral) |
//   | Survives a reload / restart | yes | no — last tab closes, value is gone |
//   | Cross-tab sync | yes, as a side effect of the `storage` event | yes, deliberately, over the channel |
//   | Sync when `BroadcastChannel` exists | still the `storage` event | `BroadcastChannel` |
//   | Cost per update | a storage write | a message |
//   | Reaches a tab opened later | yes, it reads storage | yes, via the mount-time request/announce below |
//
// USE `usePersistentState` for anything the user would expect to still be there tomorrow — theme, collapsed
// sidebar, draft text, consent. USE THIS for state that is only meaningful while the tabs are open: which tab is
// playing audio, a live cursor position, "a sync is running", a wizard step mirrored across windows. Writing
// ephemeral state through `localStorage` leaves litter that outlives its meaning and re-appears, stale, on the
// next visit; persisting it is the actual bug that this hook exists to avoid.
//
// THE LATE-JOINER PROBLEM, AND THE FIX: a message-only mirror leaves a tab opened later holding `initial` while
// everyone else has moved on — it hears only FUTURE changes. So on mount this hook posts a `request`, and every
// tab already holding the value answers with an `announce`. With several peers, several answers arrive; they
// agree, so last-write-wins is harmless. A tab that opens when NO other tab is open keeps `initial`, which is
// correct — there is no shared value to inherit.
//
// NOT A CONFLICT-FREE TYPE. Two tabs writing in the same instant both broadcast, and each ends on whichever
// message it received last — the values can diverge. Fine for state with one natural writer at a time; wrong
// for a shared editable document, which needs a CRDT or a server, not a broadcast.

import { useCallback, useEffect, useRef, useState } from 'react';

import { createSyncChannel } from './CreateSyncChannel';
import type { SyncChannel, SyncChannelOptions } from './SyncChannel';

/** Prefixes the channel name so this hook's traffic cannot collide with a consumer's own channel. */
const CHANNEL_PREFIX = 'broadcast-state.';

/** Carries the mirror's traffic: a value announcement, or a late joiner asking to be caught up. */
type BroadcastStateSignal<T> =
  /** Publishes the sender's current value; every receiver adopts it. */
  | { readonly kind: 'announce'; readonly value: T }
  /** Asks peers to announce, so a tab that just opened can catch up. */
  | { readonly kind: 'request' };

/** A setter accepting a next value or an updater fn, mirroring `useState`'s dispatch. */
export type SetBroadcastState<T> = (next: T | ((previous: T) => T)) => void;

/**
 * Manages a piece of React state mirrored live across every open tab, without persisting it anywhere.
 *
 * Setting the value here sets it in every other tab holding the same `key`; a tab that opens later asks its
 * peers for the current value on mount. Nothing is written to storage, so the value vanishes when the last tab
 * closes — read this file's header for the split with `usePersistentState`, which is the durable counterpart.
 *
 * SSR-safe: no channel is opened on the server, so the value is simply `initial` and the setter is local.
 *
 * @typeParam T - The mirrored value; must survive the transport (JSON-only on the `storage` fallback).
 * @param key - Identifies the shared value; tabs sharing it on this origin mirror each other.
 * @param initial - The value before any peer answers, and the value when no other tab is open.
 * @param options - Channel configuration, read once when the channel opens.
 * @returns A `[value, setValue]` tuple; `setValue` takes a value or an updater fn.
 */
export function useBroadcastState<T>(
  key: string,
  initial: T,
  options?: SyncChannelOptions,
): [T, SetBroadcastState<T>] {
  const [value, setValue] = useState<T>(initial);

  // The authoritative current value for code paths that must not depend on render timing: the `request`
  // responder (which answers from an effect that never re-subscribes) and the updater-fn form of the setter.
  const valueRef = useRef(value);
  valueRef.current = value;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const channelRef = useRef<SyncChannel<BroadcastStateSignal<T>> | null>(null);

  useEffect(() => {
    const channel = createSyncChannel<BroadcastStateSignal<T>>(
      `${CHANNEL_PREFIX}${key}`,
      optionsRef.current,
    );
    channelRef.current = channel;

    const unsubscribe = channel.subscribe((signal) => {
      if (typeof signal !== 'object' || signal === null) return;

      if (signal.kind === 'announce') {
        valueRef.current = signal.value;
        setValue(signal.value);
        return;
      }

      // A peer just opened and is asking to be caught up; answer with what this tab holds.
      channel.post({ kind: 'announce', value: valueRef.current });
    });

    channel.post({ kind: 'request' });

    return () => {
      unsubscribe();
      channel.close();
      channelRef.current = null;
    };
  }, [key]);

  const setBroadcastState = useCallback<SetBroadcastState<T>>((next) => {
    // Resolved against the ref rather than inside a `setValue` updater, so the broadcast is not a side effect
    // in an updater — React may invoke those twice (StrictMode), which would double-post.
    const resolved =
      typeof next === 'function' ? (next as (previous: T) => T)(valueRef.current) : next;

    valueRef.current = resolved;
    setValue(resolved);
    channelRef.current?.post({ kind: 'announce', value: resolved });
  }, []);

  return [value, setBroadcastState];
}
