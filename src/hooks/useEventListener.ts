import { useEffect, useLayoutEffect, useRef } from 'react';

type Target = Window | Document | HTMLElement | null;

/**
 * Add an event listener and clean it up automatically. Handler is read from
 * a ref so consumers don't need to memoize it.
 */
export function useEventListener<K extends string>(
  event: K,
  handler: (event: Event) => void,
  target: Target = document,
  options?: boolean | AddEventListenerOptions,
): void {
  const handlerRef = useRef(handler);
  const optionsRef = useRef(options);
  useLayoutEffect(() => {
    handlerRef.current = handler;
    optionsRef.current = options;
  }, [handler, options]);

  useEffect(() => {
    if (!target) return;
    // Capture options at attach time — remove must use the same capture flag.
    const listenerOptions = optionsRef.current;
    const listener = (e: Event) => handlerRef.current(e);
    target.addEventListener(event, listener, listenerOptions);
    return () => target.removeEventListener(event, listener, listenerOptions);
  }, [event, target]);
}
