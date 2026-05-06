import { useCallback, useRef } from 'react';
import type { SyntheticEvent } from 'react';

/**
 * Throttle a React event handler. First call in a `ms` window fires; subsequent
 * within the window are swallowed via `event.preventDefault()`. When `ms` is
 * `undefined`, the handler passes through unchanged. Use to prevent rapid-fire
 * gestures (double-clicks, double-submits, repeated touches) without wiring
 * timer state in the consumer.
 *
 * Functionally a *throttle* (first wins). The `Debounce` naming is kept for
 * vocabulary consistency with the `debounceMs` props on consuming components.
 */
export function useDebounceHandler<E extends SyntheticEvent>(
  handler: ((event: E) => void) | undefined,
  ms: number | undefined,
): (event: E) => void {
  const lastTimeRef = useRef(0);
  return useCallback(
    (event: E) => {
      if (ms !== undefined) {
        const now = Date.now();
        if (now - lastTimeRef.current < ms) {
          event.preventDefault();
          return;
        }
        lastTimeRef.current = now;
      }
      handler?.(event);
    },
    [handler, ms],
  );
}
