import type { LazyRoute } from './RouteConfig';

/** The pause before a failed code-split import is retried once. */
const RetryDelayMs = 300;

/** Resolves after the given number of milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Forces a full reload to fetch the current deploy's chunk manifest — a last resort for a persistent chunk-load failure. */
export function reloadOnChunkError(): void {
  window.location.reload();
}

/**
 * Wraps a code-split importer so a transient chunk-load failure — typically a stale deploy whose
 * hashed chunk no longer exists after a redeploy — retries once after a short delay before
 * rejecting. A persistent failure rejects so the route's `errorElement` catches it. Stays
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
