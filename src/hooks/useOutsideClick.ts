import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Fire `handler` when the user clicks outside any of the provided refs.
 * Uses `pointerdown` so it fires before focus shifts (avoids losing focus
 * inside an overlay before a click on a trigger registers).
 */
export function useOutsideClick(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: (event: PointerEvent) => void,
  enabled = true,
): void {
  const handlerRef = useRef(handler);
  const refsRef = useRef(refs);
  useLayoutEffect(() => {
    handlerRef.current = handler;
    refsRef.current = refs;
  }, [handler, refs]);

  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const refList = Array.isArray(refsRef.current) ? refsRef.current : [refsRef.current];
      for (const ref of refList) {
        if (ref.current && ref.current.contains(target)) return;
      }
      handlerRef.current(e);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [enabled]);
}
