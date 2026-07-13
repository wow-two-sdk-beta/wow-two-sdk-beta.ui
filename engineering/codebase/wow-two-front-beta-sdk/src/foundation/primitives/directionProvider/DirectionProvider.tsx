import { createContext, useContext, type ReactNode } from 'react';

/** Defines the reading direction of a subtree. */
export const Direction = {
  /** Refers to left-to-right reading order. */
  Ltr: 'ltr',
  /** Refers to right-to-left reading order. */
  Rtl: 'rtl',
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];

const DirectionContext = createContext<Direction>(Direction.Ltr);

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
