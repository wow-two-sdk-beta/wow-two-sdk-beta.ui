import { useEffect, useRef } from 'react';

/**
 * Fire `handler` when the Escape key is pressed at the document level.
 * For nested overlays, the topmost should call `event.stopPropagation()` in
 * its handler — `DismissableLayer` handles this stack-style.
 */
export function useEscape(handler: (event: KeyboardEvent) => void, enabled = true): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handlerRef.current(e);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
