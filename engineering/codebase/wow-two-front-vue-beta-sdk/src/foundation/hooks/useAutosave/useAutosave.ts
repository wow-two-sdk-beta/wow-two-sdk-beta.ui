import { onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from 'vue';

// Debounced autosave. Watches a value and, after it settles for `delayMs`, calls `save` — collapsing a burst of
// edits into a single write and exposing a `status` a consumer can surface ("Saving…"/"Saved"). Pairs naturally
// with `createVersionedStore` (autosave a form draft into a versioned store) but is storage-agnostic: `save`
// is any sync or async sink. The initial value is never saved; only changes after setup schedule a run.

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
  readonly delayMs?: MaybeRefOrGetter<number>;

  /** Whether autosave is active; when `false`, pending saves are cancelled and none are scheduled. Defaults to `true`. */
  readonly enabled?: MaybeRefOrGetter<boolean>;

  /** Invoked with the failure when a `save` throws or rejects. */
  readonly onError?: (error: unknown) => void;
}

/** The autosave handle — current status, the last-saved timestamp, and manual `flush` / `cancel` controls. */
export interface AutosaveControls {
  /** The current pipeline status. */
  readonly status: Readonly<ShallowRef<AutosaveStatus>>;

  /** `Date.now()` of the last successful save, or null if none has succeeded. */
  readonly lastSavedAt: Readonly<ShallowRef<number | null>>;

  /** Cancels any pending debounce and saves the latest value immediately. */
  flush(): void;

  /** Drops a pending save without running it; returns the pipeline to `idle`. */
  cancel(): void;
}

/**
 * Autosaves `value` through `save`, debounced by `delayMs`. Each change to `value` restarts the debounce; when
 * it elapses, `save(value)` runs. An async `save` drives `status` through `saving` → `saved` / `error`; a stale
 * run (a newer change superseded it) is ignored so status never flickers backwards. A pending save is flushed
 * synchronously when the scope is disposed so an in-progress edit is not lost.
 *
 * `value` is watched deeply, which is the point of the Vue signature: pass a `reactive` draft or a getter over
 * one (`() => form.state`) and a nested edit schedules a save — no need to rebuild the object to signal a
 * change, as the React original required. `enabled` is watched too: flipping it off cancels the pending save,
 * flipping it back on schedules one. `delayMs` is read when a save is scheduled, so a change to it applies from
 * the next edit rather than rescheduling the current window.
 */
export function useAutosave<T>(
  value: MaybeRefOrGetter<T>,
  save: (value: T) => void | Promise<void>,
  options?: UseAutosaveOptions,
): AutosaveControls {
  const { delayMs = 800, enabled = true, onError } = options ?? {};

  const status = shallowRef<AutosaveStatus>('idle');
  const lastSavedAt = shallowRef<number | null>(null);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let isDisposed = false;
  // A pending-save latch read by the dispose handler. It is distinct from `timer` because the dispose path
  // clears the timer before it can be inspected — `pending` survives that, so the final flush knows a save
  // was owed.
  let pending = false;
  // Monotonic run id — an async save that resolves after a newer run started is stale and its status is dropped.
  let runId = 0;

  const isEnabled = (): boolean => toValue(enabled);

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  /** Runs `save` now, tracks the run against `runId`, and reflects the outcome in status (if still live + current). */
  function run(): void {
    clearTimer();
    pending = false;
    const currentRun = ++runId;
    const current = toValue(value);

    let outcome: void | Promise<void>;
    try {
      outcome = save(current);
    } catch (error) {
      onError?.(error);
      if (!isDisposed && currentRun === runId) status.value = 'error';
      return;
    }

    if (outcome instanceof Promise) {
      if (!isDisposed) status.value = 'saving';
      outcome.then(
        () => {
          if (isDisposed || currentRun !== runId) return;
          status.value = 'saved';
          lastSavedAt.value = Date.now();
        },
        (error: unknown) => {
          onError?.(error);
          if (!isDisposed && currentRun === runId) status.value = 'error';
        },
      );
      return;
    }

    // Synchronous save — settled the moment it returned.
    if (!isDisposed && currentRun === runId) {
      status.value = 'saved';
      lastSavedAt.value = Date.now();
    }
  }

  function flush(): void {
    if (timer === null) return; // nothing pending
    run();
  }

  function cancel(): void {
    clearTimer();
    pending = false;
    // Invalidate any in-flight async run so its late resolution can't move status.
    runId++;
    if (!isDisposed) status.value = 'idle';
  }

  // Schedule a debounced save whenever the value (or the gate) changes. The watcher is not `immediate`, so the
  // initial value is never saved — the Vue equivalent of the original's skip-the-mount-render latch.
  watch(
    [() => toValue(value), isEnabled],
    () => {
      if (!isEnabled()) {
        clearTimer();
        pending = false;
        return;
      }

      status.value = 'pending';
      clearTimer();
      pending = true;
      timer = setTimeout(run, toValue(delayMs));
    },
    { deep: true },
  );

  // On dispose, flush a pending save synchronously so a mid-edit change isn't dropped, then stop touching state.
  onScopeDispose(() => {
    isDisposed = true;
    clearTimer();
    if (pending) {
      pending = false;
      // Fire-and-forget: the component is gone, so we don't await or set status — just don't lose the write.
      try {
        void save(toValue(value));
      } catch {
        // A failing save during teardown has nowhere to surface; swallow it.
      }
    }
  });

  return { status, lastSavedAt, flush, cancel };
}
