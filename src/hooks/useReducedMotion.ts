import { useMediaQuery } from './useMediaQuery';

/**
 * Returns `true` when the user has requested reduced motion via OS settings.
 * Components should short-circuit looping/transitional animations to a
 * static final state when this is `true`.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
