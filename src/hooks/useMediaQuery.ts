import { useCallback, useSyncExternalStore } from 'react';

/**
 * Reactively follow a CSS media query. Pass a query string like
 * `'(min-width: 768px)'` or `'(prefers-reduced-motion: reduce)'`.
 * SSR-safe — renders `false` on the server, syncs to the real value on the client.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
