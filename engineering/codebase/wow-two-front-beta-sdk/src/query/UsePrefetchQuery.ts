import { useCallback, useEffect, type FocusEventHandler, type MouseEventHandler } from 'react';
import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';

/**
 * The app client bound by the most recently mounted `usePrefetchQuery`.
 * Powers the standalone `prefetchProps`, mirroring the router's module-level
 * prefetch registry — data prefetch needs a client, so the hook binds it here.
 */
let activeClient: QueryClient | undefined;

/** Defines a prefetch target — a query key paired with its fetcher. */
export interface PrefetchTarget {
  /** The query key to warm — the same key the live query reads. */
  readonly key: QueryKey;

  /** Fetches the data to cache; receives the abort signal React Query manages. */
  readonly queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
}

/** Defines the hover/focus handlers to spread onto a `<Link>` for data prefetch. */
export interface PrefetchProps {
  /** Warms the target query when the pointer enters the link. */
  readonly onMouseEnter: MouseEventHandler;

  /** Warms the target query when the link gains focus. */
  readonly onFocus: FocusEventHandler;
}

/** Warms a query's data against a client — a background fetch React Query dedupes against the live query. */
function warm(client: QueryClient, { key, queryFn }: PrefetchTarget): void {
  void client.prefetchQuery({ queryKey: key, queryFn });
}

/** Manages intent-based data prefetch — returns a stable `prefetch(target)` that warms a query on hover/focus. */
export function usePrefetchQuery(): (target: PrefetchTarget) => void {
  const client = useQueryClient();

  // Bind the client for the standalone `prefetchProps`, mirroring the router's registry.
  useEffect(() => {
    activeClient = client;
    return () => {
      if (activeClient === client) activeClient = undefined;
    };
  }, [client]);

  return useCallback((target: PrefetchTarget) => warm(client, target), [client]);
}

/** Builds hover/focus handlers that warm a query's data on intent — spread onto a `<Link>` beside the router's `prefetchProps`. Requires a mounted `usePrefetchQuery`. */
export function prefetchProps(target: PrefetchTarget): PrefetchProps {
  const run = (): void => {
    if (activeClient) warm(activeClient, target);
  };
  return { onMouseEnter: run, onFocus: run };
}
