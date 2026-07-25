// The React seam over the two history flavors — ownership and re-rendering, no history logic.
//
// A history is a long-lived mutable object whose interesting members are getters, so a component cannot simply
// hold it and expect to re-render: nothing about `canUndo` flipping is visible to React. `useHistoryVersion`
// closes that gap through `useSyncExternalStore`, subscribing to the store and reading its monotonic revision —
// identity-stable between changes, which a derived value like `size` or a fresh array would not be. Every hook
// here calls it, so the returned history object is stable across renders while the values read off it are fresh.
//
// Non-obvious decisions:
// - Options are captured on the FIRST render, because the history is created once. `limit` and `coalesceMs` are
//   configuration and effectively constant; `onError` and `now` are routed through a ref instead, since those
//   two are routinely fresh closures and a stale one would swallow real errors.
// - `useUndoableState` is deliberately uncontrolled-only. A controlled seam (`value` / `onChange`) would let a
//   parent change the value out of band, and the history's `present` — the anchor every entry's `before` was
//   captured against — would silently stop matching the rendered state. Travel would then restore states the
//   parent never agreed to. A caller who must own the value should own a `createSnapshotHistory` too and drive
//   `record` from its own reducer.
// - The setter takes per-call record options, because `coalesceKey` is a property of the interaction (a drag, a
//   typing burst), not of the hook. A component types with one key and drags a slider with another.

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';

import type { HistoryOptions, HistoryStore } from './HistoryCore';
import { createSnapshotHistory, type SnapshotHistory, type SnapshotRecordOptions } from './SnapshotHistory';
import { createUndoHistory, type UndoHistory } from './UndoHistory';

/**
 * Subscribes to a history's changes and returns its version counter, re-rendering the caller on every push,
 * undo, redo, and clear. Use it directly when the history is owned outside React (a module-scope editor store).
 */
export function useHistoryVersion(store: HistoryStore): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(onStoreChange),
    [store],
  );
  const getVersion = useCallback(() => store.version(), [store]);
  // Server snapshot is the same read — a history is plain in-memory state with no client-only source.
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}

/** Builds the options a hook-owned history is created with, routing the two closure-shaped fields through a ref. */
function hookOptions(
  options: HistoryOptions | undefined,
  optionsRef: { current: HistoryOptions | undefined },
): HistoryOptions {
  return {
    limit: options?.limit,
    coalesceMs: options?.coalesceMs,
    onError: (error, phase) => optionsRef.current?.onError?.(error, phase),
    now: () => (optionsRef.current?.now ?? Date.now)(),
  };
}

/**
 * Owns a command-based {@link UndoHistory} for the component's lifetime and re-renders on every change.
 *
 * The returned object is stable across renders — pass it down, or to {@link useUndoShortcuts}, without
 * memoising. Its `canUndo` / `undoLabel` members are getters, so read them during render rather than caching.
 */
export function useUndoHistory(options?: HistoryOptions): UndoHistory {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [history] = useState(() => createUndoHistory(hookOptions(options, optionsRef)));
  useHistoryVersion(history);

  return history;
}

/** Publishes the next state — a value or an updater, plus how this particular change should be recorded. */
export type UndoableStateSetter<TState> = (
  next: TState | ((previous: TState) => TState),
  options?: SnapshotRecordOptions,
) => void;

/**
 * `useState` with a history behind it — the snapshot flavor as a drop-in for small, immutable state.
 *
 * Returns `[state, setState, history]`. The setter accepts a value or an updater like React's, plus optional
 * per-call record options (`{ label, coalesceKey }`); the third slot is the full {@link SnapshotHistory}, so
 * `undo` / `redo` / `canUndo` / `transact` and {@link useUndoShortcuts} are all available from it.
 *
 * ```ts
 * const [text, setText, history] = useUndoableState('');
 * setText((prev) => prev + 'a', { label: 'Typing', coalesceKey: 'text' });
 * useUndoShortcuts(history);
 * ```
 *
 * As with `useState`, an updater is the only way to store a function-typed state.
 */
export function useUndoableState<TState>(
  initial: TState,
  options?: HistoryOptions,
): [TState, UndoableStateSetter<TState>, SnapshotHistory<TState>] {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [history] = useState(() => createSnapshotHistory(initial, hookOptions(options, optionsRef)));
  useHistoryVersion(history);

  const setState = useCallback<UndoableStateSetter<TState>>(
    (next, recordOptions) => {
      // Resolved against the history's live `present`, not a captured render value, so two setters in one tick
      // compose the way `useState`'s updater form does.
      const value =
        typeof next === 'function'
          ? (next as (previous: TState) => TState)(history.present)
          : next;
      history.record(value, recordOptions);
    },
    [history],
  );

  return [history.present, setState, history];
}
