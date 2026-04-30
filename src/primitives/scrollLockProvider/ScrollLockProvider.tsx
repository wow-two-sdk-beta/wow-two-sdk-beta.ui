import { type ReactNode } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';

export interface ScrollLockProviderProps {
  enabled?: boolean;
  children: ReactNode;
}

/**
 * Component wrapper around `useScrollLock` — handy when scroll lock should
 * follow a child's mount lifecycle (e.g. inside a Modal's portal).
 * Multiple wrappers stack; lock releases when the count reaches zero.
 */
export function ScrollLockProvider({ enabled = true, children }: ScrollLockProviderProps) {
  useScrollLock(enabled);
  return <>{children}</>;
}
