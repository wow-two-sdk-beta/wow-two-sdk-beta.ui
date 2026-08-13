import { onScopeDispose, shallowRef, toValue, type MaybeRefOrGetter, type ShallowRef } from 'vue';

export interface UseClipboardOptions {
  /** Reset `copied` back to false after this many ms. Default 2000. Set 0 to keep state until explicitly reset. */
  resetAfter?: MaybeRefOrGetter<number>;
}

export interface ClipboardControls {
  /** True for `resetAfter` ms after a successful copy. */
  copied: Readonly<ShallowRef<boolean>>;

  /** Last error from `navigator.clipboard.writeText`, if any. */
  error: Readonly<ShallowRef<Error | null>>;

  /** Write `text` to the system clipboard. Returns the promise. */
  copy: (text: string) => Promise<void>;

  /** Force-clear the `copied` flag. */
  reset: () => void;
}

/**
 * Wraps `navigator.clipboard.writeText` with a transient `copied` flag for
 * post-action UI (icon swap, "Copied!" tooltip). Pass `resetAfter: 0` to
 * keep `copied` true until you call `reset()`.
 *
 * `resetAfter` may be a ref or getter; it is read at copy time, so a window
 * changed between copies takes effect on the next one.
 */
export function useClipboard({ resetAfter = 2000 }: UseClipboardOptions = {}): ClipboardControls {
  const copied = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const reset = (): void => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    copied.value = false;
    error.value = null;
  };

  const copy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      error.value = null;
      copied.value = true;
      const resetWindow = toValue(resetAfter);
      if (resetWindow > 0) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          copied.value = false;
        }, resetWindow);
      }
    } catch (err) {
      copied.value = false;
      error.value = err instanceof Error ? err : new Error(String(err));
    }
  };

  onScopeDispose(() => {
    if (timeout) clearTimeout(timeout);
  });

  return { copied, error, copy, reset };
}
