import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow: string | null = null;
let originalPaddingRight: string | null = null;

function getScrollbarWidth(): number {
  return window.innerWidth - document.documentElement.clientWidth;
}

/**
 * Prevent body scroll while at least one consumer has the lock active.
 * Internally counted — multiple overlays may lock; only the last unlock restores.
 * Compensates for scrollbar width to avoid layout shift.
 */
export function useScrollLock(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    if (lockCount === 0) {
      const body = document.body;
      const scrollbarWidth = getScrollbarWidth();
      originalOverflow = body.style.overflow;
      originalPaddingRight = body.style.paddingRight;
      body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        const body = document.body;
        body.style.overflow = originalOverflow ?? '';
        body.style.paddingRight = originalPaddingRight ?? '';
        originalOverflow = null;
        originalPaddingRight = null;
      }
    };
  }, [enabled]);
}
