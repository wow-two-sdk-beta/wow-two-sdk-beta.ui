import type { Component } from 'vue';

import type { LazyRoute } from './RouteConfig';

/** The pause before a failed code-split import is retried once. */
const RetryDelayMs = 300;

/** Resolves after the given number of milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Forces a full reload to fetch the current deploy's chunk manifest — a last resort for a persistent chunk-load failure. No-op without a `window` (SSR). */
export function reloadOnChunkError(): void {
  if (typeof window === 'undefined') return;
  window.location.reload();
}

/**
 * Wraps a code-split importer so a transient chunk-load failure — typically a stale deploy whose
 * hashed chunk no longer exists after a redeploy — retries once after a short delay before
 * rejecting. A persistent failure rejects so the router's error handling catches it. Stays
 * type-compatible with `LazyRoute`.
 */
export function lazyRoute(importer: LazyRoute): LazyRoute {
  return async () => {
    try {
      return await importer();
    } catch {
      await delay(RetryDelayMs);
      return importer();
    }
  };
}

/**
 * @internal Normalizes a `default | Component` lazy module into the single component vue-router's
 * async `component` loader expects.
 */
export function toAsyncComponent(lazy: LazyRoute): () => Promise<Component> {
  return async () => {
    const module = await lazy();
    return 'default' in module ? module.default : module.Component;
  };
}
