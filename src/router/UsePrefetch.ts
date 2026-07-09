import type { FocusEventHandler, MouseEventHandler } from 'react';

import type { LazyRoute } from './RouteConfig';

/** @internal Importers already warmed this session — backs prefetch deduplication. */
const prefetched = new WeakSet<LazyRoute>();

/** Fires a lazy route's dynamic import once to warm its chunk; repeat calls for the same importer are ignored. */
export function prefetch(importer: LazyRoute): void {
  if (prefetched.has(importer)) return;
  prefetched.add(importer);
  void importer().catch(() => {
    // Prefetch is best-effort — a failed warm-up is retried by the router's own lazy load on navigation.
  });
}

/** Defines the hover/focus handlers to spread onto a `<Link>` for intent prefetch. */
export interface PrefetchProps {
  /** Warms the target chunk when the pointer enters the link. */
  readonly onMouseEnter: MouseEventHandler;

  /** Warms the target chunk when the link gains focus. */
  readonly onFocus: FocusEventHandler;
}

/** Builds hover/focus handlers that prefetch a lazy route's chunk on intent — spread onto a `<Link>`. */
export function prefetchProps(importer: LazyRoute): PrefetchProps {
  return {
    onMouseEnter: () => prefetch(importer),
    onFocus: () => prefetch(importer),
  };
}

/** Manages intent-based prefetch — returns a `prefetch(importer)` that warms a lazy chunk exactly once. */
export function usePrefetch(): (importer: LazyRoute) => void {
  return prefetch;
}
