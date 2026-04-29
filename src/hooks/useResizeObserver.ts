import { useEffect, useRef, type RefObject } from 'react';

/**
 * Run `callback` whenever the referenced element's size changes. Returns
 * synchronously after layout, before paint. Cleans up automatically.
 */
export function useResizeObserver<T extends HTMLElement>(
  ref: RefObject<T | null>,
  callback: (entry: ResizeObserverEntry) => void,
  enabled = true,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || !ref.current || typeof ResizeObserver === 'undefined') return;
    const element = ref.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) callbackRef.current(entry);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled]);
}
