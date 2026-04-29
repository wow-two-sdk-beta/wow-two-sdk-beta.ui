import { useId as useReactId } from 'react';

/**
 * Wraps React 19's `useId`. Optionally accepts a stable prefix so generated
 * IDs are easier to spot in DevTools (e.g. `useId('checkbox')` → `:r2:-checkbox`).
 */
export function useId(prefix?: string): string {
  const id = useReactId();
  return prefix ? `${id}-${prefix}` : id;
}
