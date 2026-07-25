// The React subscription seam over a queue — how a component re-renders as uploads progress. Mirrors
// `commands`' `UseCommandRegistry.ts`: the store is framework-free, this file is the only part that imports React.
//
// Non-obvious decisions:
// - These read `queue.version()` as the `useSyncExternalStore` snapshot, NOT `items()` / `state()`. Both build a
//   fresh value per call, so either as the snapshot would look changed on every render and loop forever. The
//   monotonic counter is identity-stable between mutations; the arrays and the aggregate derive from it via
//   `useMemo`.
// - `useUploadQueueSnapshot(queue)` takes the queue EXPLICITLY, so an app that owns a module-scope queue (uploads
//   that must survive unmounting the panel) can subscribe without this file creating anything.
// - `useUploadQueue(options)` is the convenience on top and creates its queue ONCE, via `useState`'s lazy
//   initializer — the queue holds in-flight work, so rebuilding it on a changed option would strand running
//   uploads. Consequence, stated plainly: `concurrency` / `accept` / `maxSize` / `retry` are read at MOUNT and
//   later changes are ignored. Need them dynamic → own the queue and re-create it deliberately.
// - `transport` is the exception: it is delegated through a ref, so an inline `{ upload: ... }` closing over
//   current props stays live instead of being frozen at first render. Same trick `CommandsProvider` uses for
//   `onError`, and it is what makes the common inline call site correct without any memoization by the caller.
// - The action callbacks are the queue's own methods. They are created once inside the closure and are already
//   referentially stable, so no `useCallback` wrapper is needed or added.

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import type { UploadItem } from './UploadItem';
import { createUploadQueue, type UploadQueue, type UploadQueueOptions, type UploadQueueState } from './UploadQueue';

/**
 * Subscribes to a queue's mutations and returns its version counter. The building block behind
 * {@link useUploadQueueSnapshot}; use it directly to derive a custom projection
 * (`useMemo(() => queue.items().filter(failed), [queue, version])`).
 */
export function useUploadQueueVersion<TResult = unknown>(queue: UploadQueue<TResult>): number {
  const subscribe = useCallback((onStoreChange: () => void) => queue.subscribe(onStoreChange), [queue]);
  const getVersion = useCallback(() => queue.version(), [queue]);
  // Server snapshot is the same read — the queue is plain in-memory state with no client-only source.
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}

/** The item list plus the aggregate state of an explicitly-owned queue, re-rendering the caller on every change. */
export function useUploadQueueSnapshot<TResult = unknown>(
  queue: UploadQueue<TResult>,
): { readonly items: readonly UploadItem<TResult>[]; readonly state: UploadQueueState } {
  const version = useUploadQueueVersion(queue);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` is the mutation cursor that invalidates both reads
  return useMemo(() => ({ items: queue.items(), state: queue.state() }), [queue, version]);
}

/** What {@link useUploadQueue} hands a component — live state plus every queue action. */
export interface UseUploadQueueResult<TResult = unknown> {
  /** The underlying queue, for anything the flattened actions don't cover (`get`, `subscribe`, passing it down). */
  readonly queue: UploadQueue<TResult>;

  /** Every item in admission order, refreshed on each change. */
  readonly items: readonly UploadItem<TResult>[];

  /** The aggregate snapshot — counts, byte totals, overall progress. */
  readonly state: UploadQueueState;

  /** Admits one file or many; returns the new item ids. See `UploadQueue.add`. */
  readonly add: UploadQueue<TResult>['add'];

  /** Aborts one item. See `UploadQueue.cancel`. */
  readonly cancel: UploadQueue<TResult>['cancel'];

  /** Aborts every queued and uploading item. */
  readonly cancelAll: UploadQueue<TResult>['cancelAll'];

  /** Re-queues a failed or cancelled item. */
  readonly retry: UploadQueue<TResult>['retry'];

  /** Drops an item, aborting it first when in flight. */
  readonly remove: UploadQueue<TResult>['remove'];

  /** Drops every item, cancelling anything still in flight. */
  readonly clear: UploadQueue<TResult>['clear'];
}

/**
 * Creates an upload queue scoped to the component and subscribes to it — the one-call entry point for an upload
 * panel or drop zone.
 *
 * The queue is created on first render and kept for the component's lifetime, so `concurrency` / `accept` /
 * `maxSize` / `retry` are mount-time values (`transport` stays live — see the file header). Unmounting does NOT
 * cancel in-flight uploads; call `cancelAll` in an effect cleanup if that is the behaviour you want, or hoist the
 * queue out of the component with `createUploadQueue` + {@link useUploadQueueSnapshot} so uploads survive it.
 */
export function useUploadQueue<TResult = unknown>(options: UploadQueueOptions<TResult>): UseUploadQueueResult<TResult> {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [queue] = useState(() =>
    createUploadQueue<TResult>({
      ...options,
      // Delegated, not captured: the latest render's transport handles every attempt.
      transport: { upload: (file, context) => optionsRef.current.transport.upload(file, context) },
    }),
  );

  const { items, state } = useUploadQueueSnapshot(queue);

  return {
    queue,
    items,
    state,
    add: queue.add,
    cancel: queue.cancel,
    cancelAll: queue.cancelAll,
    retry: queue.retry,
    remove: queue.remove,
    clear: queue.clear,
  };
}
