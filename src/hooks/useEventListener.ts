import { useEffect, useRef } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

type Target = Window | Document | HTMLElement | null;

/**
 * Add an event listener and clean it up automatically. Handler is read from
 * a ref so consumers don't need to memoize it.
 */
export function useEventListener<K extends string>(
  event: K,
  handler: (event: Event) => void,
  target: Target = typeof document !== 'undefined' ? document : null,
  options?: boolean | AddEventListenerOptions,
): void {
  const handlerRef = useRef(handler);
  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!target) return;
    const listener = (e: Event) => handlerRef.current(e);
    target.addEventListener(event, listener, options);
    return () => target.removeEventListener(event, listener, options);
  }, [event, target, options]);
}
