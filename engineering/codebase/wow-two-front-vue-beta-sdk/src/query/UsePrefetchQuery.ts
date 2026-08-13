import { onScopeDispose } from 'vue';
import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/vue-query';

/**
 * The app client bound by the most recently mounted `usePrefetchQuery`. Powers the standalone
 * `prefetchProps`, mirroring the router's module-level prefetch registry — data prefetch needs a
 * client, so the composable binds it here.
 */
let activeClient: QueryClient | undefined;

/** Defines a prefetch target — a query key paired with its fetcher. */
export interface PrefetchTarget {
  /** The query key to warm — the same key the live query reads. */
  readonly key: QueryKey;

  /** Fetches the data to cache; receives the abort signal the library manages. */
  readonly queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
}

/**
 * Defines the hover/focus listeners to `v-bind` onto a link for data prefetch.
 *
 * `onMouseenter`, not React's `onMouseEnter`: Vue derives the DOM event name with `hyphenate()`, so
 * a camel-humped `onMouseEnter` key would bind a `mouse-enter` event that never fires.
 */
export interface PrefetchProps {
  /** Warms the target query when the pointer enters the link. */
  readonly onMouseenter: () => void;

  /** Warms the target query when the link gains focus. */
  readonly onFocus: () => void;
}

/** Warms a query's data against a client — a background fetch deduped against the live query. */
function warm(client: QueryClient, { key, queryFn }: PrefetchTarget): void {
  void client.prefetchQuery({ queryKey: key, queryFn });
}

/** Manages intent-based data prefetch — returns a `prefetch(target)` that warms a query on hover/focus. */
export function usePrefetchQuery(): (target: PrefetchTarget) => void {
  const client = useQueryClient();

  // Bind the client for the standalone `prefetchProps`, mirroring the router's registry. React did
  // this in an effect; the scope teardown is the Vue counterpart of that effect's cleanup.
  activeClient = client;
  onScopeDispose(() => {
    if (activeClient === client) activeClient = undefined;
  });

  return (target: PrefetchTarget) => warm(client, target);
}

/** Builds hover/focus listeners that warm a query's data on intent — `v-bind` onto a link beside the router's `prefetchProps`. Requires a mounted `usePrefetchQuery`. */
export function prefetchProps(target: PrefetchTarget): PrefetchProps {
  const run = (): void => {
    if (activeClient) warm(activeClient, target);
  };
  return { onMouseenter: run, onFocus: run };
}
