// React binding for `createSyncChannel` — one channel per mount, torn down on unmount.
//
// THE LIFETIME RULE THIS ENFORCES: a channel holds a real `BroadcastChannel` (or a window listener), so a
// component that opens one and forgets it leaks a handle that keeps receiving after the tree is gone. Binding
// the channel to the effect makes the disposal automatic and makes double-mount (StrictMode) safe.
//
// WHY `onMessage` LIVES IN A REF: an inline arrow is a new identity every render. In the effect's deps it would
// tear down and rebuild the channel on every render — dropping messages in the gap and, on the `storage`
// fallback, churning listeners. The ref keeps the callback current while the channel stays put, so a handler
// that closes over fresh props still sees them.
//
// SAME REASONING FOR `options`, WITH A CAVEAT: they are read ONCE, when the channel opens. Changing `transport`,
// `broker`, or `keyPrefix` after mount does NOT rebuild the channel — only `name` does. Options are
// configuration, not state; a consumer that genuinely needs to swap transports at runtime should remount with a
// `key`. This mirrors how `usePersistentState` pins its broker.

import { useCallback, useEffect, useRef } from 'react';

import { createSyncChannel } from './CreateSyncChannel';
import type { SyncChannel, SyncChannelOptions, SyncListener } from './SyncChannel';

/**
 * Opens a cross-tab channel for the lifetime of the component and subscribes `onMessage` to it.
 *
 * The returned `post` sends to every OTHER tab on the channel, never back into this one. Before mount and after
 * unmount — and under SSR, where no channel is ever opened — `post` is a silent no-op, so a handler firing at
 * an awkward moment needs no guard.
 *
 * @typeParam TMessage - The payload shape agreed between tabs.
 * @param name - Channel name; every tab using it on this origin is a peer.
 * @param onMessage - Invoked for each message from another tab; may change identity freely between renders.
 * @param options - Transport and storage configuration, read once when the channel opens.
 * @returns A stable `post` function.
 */
export function useSyncChannel<TMessage>(
  name: string,
  onMessage?: SyncListener<TMessage>,
  options?: SyncChannelOptions,
): (message: TMessage) => void {
  const listenerRef = useRef(onMessage);
  listenerRef.current = onMessage;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const channelRef = useRef<SyncChannel<TMessage> | null>(null);

  useEffect(() => {
    const channel = createSyncChannel<TMessage>(name, optionsRef.current);
    channelRef.current = channel;

    // The subscription reads through the ref rather than capturing `onMessage`, which is what lets the effect
    // depend on `name` alone.
    const unsubscribe = channel.subscribe((message, envelope) => {
      listenerRef.current?.(message, envelope);
    });

    return () => {
      unsubscribe();
      channel.close();
      channelRef.current = null;
    };
  }, [name]);

  return useCallback((message: TMessage) => {
    channelRef.current?.post(message);
  }, []);
}
