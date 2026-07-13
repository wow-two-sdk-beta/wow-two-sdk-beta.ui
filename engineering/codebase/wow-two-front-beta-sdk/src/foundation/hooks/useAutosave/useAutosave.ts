import { useCallback, useEffect, useRef, useState } from 'react';

// Debounced autosave. Watches a value and, after it settles for `delayMs`, calls `save` — collapsing a burst of
// edits into a single write and exposing a `status` a consumer can surface ("Saving…"/"Saved"). Pairs naturally
// with `createVersionedStore` (autosave a form draft into a versioned store) but is storage-agnostic: `save`
// is any sync or async sink. The initial value is never saved on mount; only changes after mount schedule a run.

/** The lifecycle of the autosave pipeline. */
export type AutosaveStatus =
  /** No save has been scheduled since the last settle. */
  | 'idle'
  /** A change is waiting out the debounce window. */
  | 'pending'
  /** An async `save` is in flight. */
  | 'saving'
  /** The most recent save resolved successfully. */
  | 'saved'
  /** The most recent save threw or rejected. */
  | 'error';

/** Tunes autosave timing and gating. */
export interface UseAutosaveOptions {
  /** The quiet period (ms) a value must hold before it is saved. Defaults to `800`. */
  readonly delayMs?: number;

  /** Whether autosave is active; when `false`, pending saves are cancelled and none are scheduled. Defaults to `true`. */
  readonly enabled?: boolean;

  /** Invoked with the failure when a `save` throws or rejects. */
  readonly onError?: (error: unknown) => void;
}

/** The autosave handle — current status, the last-saved timestamp, and manual `flush` / `cancel` controls. */
export interface AutosaveControls {
  /** The current pipeline status. */
  readonly status: AutosaveStatus;

  /** `Date.now()` of the last successful save, or null if none has succeeded. */
  readonly lastSavedAt: number | null;

  /** Cancels any pending debounce and saves the latest value immediately. */
  flush(): void;

  /** Drops a pending save without running it; returns the pipeline to `idle`. */
  cancel(): void;
}

/**
 * Autosaves `value` through `save`, debounced by `delayMs`. Each change to `value` (by identity) restarts the
 * debounce; when it elapses, `save(value)` runs. An async `save` drives `status` through `saving` → `saved` /
 * `error`; a stale run (a newer change superseded it) is ignored so status never flickers backwards. A pending
 * save is flushed synchronously on unmount so an in-progress edit is not lost. Pass a referentially-stable
 * `value` (don't rebuild it every render when nothing changed) so unchanged renders don't schedule spurious saves.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => void | Promise<void>,
  options?: UseAutosaveOptions,
): AutosaveControls {
  const { delayMs = 800, enabled = true, onError } = options ?? {};

  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Latest values pinned in refs so the stable `flush`/`cancel` callbacks and the debounce timer never close
  // over a stale render.
  const valueRef = useRef(value);
  valueRef.current = value;
  const saveRef = useRef(save);
  saveRef.current = save;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  // A pending-save latch read by the unmount cleanup. It is distinct from `timerRef` because React runs the
  // debounce effect's cleanup (which nulls `timerRef`) *before* the unmount cleanup — so `timerRef` is already
  // null by the time we'd check it. `pendingRef` survives that, so the unmount flush knows a save was owed.
  const pendingRef = useRef(false);
  // Monotonic run id — an async save that resolves after a newer run started is stale and its status is dropped.
  const runIdRef = useRef(0);
  // Skip the mount render: the initial value is already persisted, so autosaving it would be a redundant write.
  const isFirstRef = useRef(true);

  const clearTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Runs `save` now, tracks the run against `runIdRef`, and reflects the outcome in status (if still mounted + current). */
  const run = useCallback((): void => {
    clearTimer();
    pendingRef.current = false;
    const runId = ++runIdRef.current;
    const current = valueRef.current;

    let outcome: void | Promise<void>;
    try {
      outcome = saveRef.current(current);
    } catch (error) {
      onErrorRef.current?.(error);
      if (mountedRef.current && runId === runIdRef.current) setStatus('error');
      return;
    }

    if (outcome instanceof Promise) {
      if (mountedRef.current) setStatus('saving');
      outcome.then(
        () => {
          if (!mountedRef.current || runId !== runIdRef.current) return;
          setStatus('saved');
          setLastSavedAt(Date.now());
        },
        (error: unknown) => {
          onErrorRef.current?.(error);
          if (mountedRef.current && runId === runIdRef.current) setStatus('error');
        },
      );
      return;
    }

    // Synchronous save — settled the moment it returned.
    if (mountedRef.current && runId === runIdRef.current) {
      setStatus('saved');
      setLastSavedAt(Date.now());
    }
  }, [clearTimer]);

  const flush = useCallback((): void => {
    if (timerRef.current === null) return; // nothing pending
    run();
  }, [run]);

  const cancel = useCallback((): void => {
    clearTimer();
    pendingRef.current = false;
    // Invalidate any in-flight async run so its late resolution can't move status.
    runIdRef.current++;
    if (mountedRef.current) setStatus('idle');
  }, [clearTimer]);

  // Schedule a debounced save whenever the value (or timing/gate) changes — after the mount render.
  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }

    if (!enabled) {
      clearTimer();
      return;
    }

    setStatus('pending');
    clearTimer();
    pendingRef.current = true;
    timerRef.current = setTimeout(run, delayMs);

    return clearTimer;
  }, [value, delayMs, enabled, run, clearTimer]);

  // On unmount, flush a pending save synchronously so a mid-edit change isn't dropped, then stop touching state.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // `pendingRef` (not `timerRef`) is the source of truth here — the debounce effect's cleanup already ran
      // and nulled the timer. A save was owed iff a change was still waiting out its debounce window.
      if (pendingRef.current) {
        pendingRef.current = false;
        // Fire-and-forget: the component is gone, so we don't await or set status — just don't lose the write.
        try {
          void saveRef.current(valueRef.current);
        } catch {
          // A failing save during teardown has nowhere to surface; swallow it.
        }
      }
    };
  }, []);

  return { status, lastSavedAt, flush, cancel };
}
