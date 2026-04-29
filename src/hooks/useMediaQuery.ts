import { useEffect, useState } from 'react';

/**
 * Reactively follow a CSS media query. Returns `false` during SSR.
 * Pass a query string like `'(min-width: 768px)'` or `'(prefers-reduced-motion: reduce)'`.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
