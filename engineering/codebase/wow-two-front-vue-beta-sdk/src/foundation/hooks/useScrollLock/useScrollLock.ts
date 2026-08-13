import { toValue, watchPostEffect, type MaybeRefOrGetter } from 'vue';

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
 *
 * `enabled` may be a ref or a getter (`() => props.isEnabled`), so the lock
 * follows a prop without the consumer re-invoking anything. The counter is
 * module-level and shared, exactly as in the original.
 */
export function useScrollLock(enabled: MaybeRefOrGetter<boolean> = true): void {
  watchPostEffect((onCleanup) => {
    if (!toValue(enabled) || typeof document === 'undefined') return;
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

    onCleanup(() => {
      lockCount -= 1;
      if (lockCount === 0) {
        const body = document.body;
        body.style.overflow = originalOverflow ?? '';
        body.style.paddingRight = originalPaddingRight ?? '';
        originalOverflow = null;
        originalPaddingRight = null;
      }
    });
  });
}
