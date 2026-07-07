import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn, Radius } from '../../../foundation/utils';

/** Defines the surface background of a `Frame`. */
export const FrameSurface = {
  /** Refers to a raised card surface. */
  Card: 'card',
  /** Refers to a recessed muted surface. */
  Muted: 'muted',
  /** Refers to no surface fill (transparent). */
  Transparent: 'transparent',
} as const;

export type FrameSurface = (typeof FrameSurface)[keyof typeof FrameSurface];

export interface FrameProps extends ComponentPropsWithoutRef<'div'> {
  /** The padding. Default `4`. */
  padding?: '0' | '2' | '3' | '4' | '6' | '8';

  /** The border radius. Default `md`. */
  radius?: Radius;

  /** The surface background — `card` (raised) or `muted` (recessed). Default `card`. */
  surface?: FrameSurface;

  /** The border visibility. Default `true`. */
  isBordered?: boolean;
}

const PADDING: Record<NonNullable<FrameProps['padding']>, string> = {
  '0': '', '2': 'p-2', '3': 'p-3', '4': 'p-4', '6': 'p-6', '8': 'p-8',
};
const RADIUS: Record<Radius, string> = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};
const SURFACE: Record<FrameSurface, string> = {
  card: 'bg-card text-card-foreground',
  muted: 'bg-muted text-foreground',
  transparent: '',
};

/**
 * Bordered shell with padding + radius — `Card` without slot semantics.
 * Use when you want the visual but not the structured Header/Body/Footer.
 */
export const Frame = forwardRef<HTMLDivElement, FrameProps>(
  ({ padding = '4', radius = Radius.Md, surface = FrameSurface.Card, isBordered = true, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        SURFACE[surface],
        PADDING[padding],
        RADIUS[radius],
        isBordered && 'border border-border',
        className,
      )}
      {...props}
    />
  ),
);
Frame.displayName = 'Frame';
