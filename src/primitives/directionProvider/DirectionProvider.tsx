import { createContext, useContext, type ReactNode } from 'react';

export type Direction = 'ltr' | 'rtl';

const DirectionContext = createContext<Direction>('ltr');

export interface DirectionProviderProps {
  dir: Direction;
  children: ReactNode;
}

/**
 * Provide reading direction to descendants. Components that mirror in RTL
 * (Tabs arrow keys, Slider, Carousel, etc.) read this via `useDirection()`.
 */
export function DirectionProvider({ dir, children }: DirectionProviderProps) {
  return <DirectionContext.Provider value={dir}>{children}</DirectionContext.Provider>;
}

export function useDirection(): Direction {
  return useContext(DirectionContext);
}
