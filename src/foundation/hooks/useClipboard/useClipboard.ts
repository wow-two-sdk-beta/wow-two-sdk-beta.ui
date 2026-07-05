import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseClipboardOptions {
  /** Reset `copied` back to false after this many ms. Default 2000. Set 0 to keep state until explicitly reset. */
  resetAfter?: number;
}

export interface ClipboardControls {
  /** True for `resetAfter` ms after a successful copy. */
  copied: boolean;
  /** Last error from `navigator.clipboard.writeText`, if any. */
  error: Error | null;
  /** Write `text` to the system clipboard. Returns the promise. */
  copy: (text: string) => Promise<void>;
  /** Force-clear the `copied` flag. */
  reset: () => void;
}

/**
 * Wraps `navigator.clipboard.writeText` with a transient `copied` flag for
 * post-action UI (icon swap, "Copied!" tooltip). Pass `resetAfter: 0` to
 * keep `copied` true until you call `reset()`.
 */
export function useClipboard({ resetAfter = 2000 }: UseClipboardOptions = {}): ClipboardControls {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setCopied(false);
    setError(null);
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setError(null);
        setCopied(true);
        if (resetAfter > 0) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setCopied(false), resetAfter);
        }
      } catch (err) {
        setCopied(false);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [resetAfter],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { copied, error, copy, reset };
}
