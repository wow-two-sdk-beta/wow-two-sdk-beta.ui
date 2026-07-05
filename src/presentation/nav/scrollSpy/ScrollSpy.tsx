import { useEffect, useState, type ReactNode } from 'react';

export interface UseScrollSpyOptions {
  rootMargin?: string;
  threshold?: number | number[];
  /** Element to observe within. Defaults to viewport. */
  root?: Element | Document | null;
}

/**
 * Track which of `ids` is currently the topmost in-view section.
 * Uses `IntersectionObserver` — returns `null` until the first intersection.
 */
export function useScrollSpy(
  ids: string[],
  { rootMargin = '0px 0px -60% 0px', threshold = 0, root = null }: UseScrollSpyOptions = {},
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || ids.length === 0) return;

    const seen = new Map<string, number>(); // id → top offset
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            seen.set(e.target.id, e.boundingClientRect.top);
          } else {
            seen.delete(e.target.id);
          }
        }
        if (seen.size === 0) return;
        // Pick the section whose top is closest to (but above) the rootMargin band.
        let bestId: string | null = null;
        let bestTop = Number.POSITIVE_INFINITY;
        for (const [id, top] of seen) {
          if (top < bestTop) {
            bestTop = top;
            bestId = id;
          }
        }
        setActiveId(bestId);
      },
      { rootMargin, threshold, root: root as Element | Document | null },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [ids, rootMargin, threshold, root]);

  return activeId;
}

export interface ScrollSpyProps extends UseScrollSpyOptions {
  ids: string[];
  onActiveChange?: (id: string | null) => void;
  children?: (ctx: { activeId: string | null }) => ReactNode;
}

/**
 * Render-prop variant of `useScrollSpy`. Emits `activeId` via callback or
 * render prop. Renders nothing by default.
 */
export function ScrollSpy({
  ids,
  rootMargin,
  threshold,
  root,
  onActiveChange,
  children,
}: ScrollSpyProps) {
  const activeId = useScrollSpy(ids, { rootMargin, threshold, root });

  useEffect(() => {
    onActiveChange?.(activeId);
  }, [activeId, onActiveChange]);

  return children ? <>{children({ activeId })}</> : null;
}
