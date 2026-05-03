import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface FrameProps extends ComponentPropsWithoutRef<'div'> {
  /** Padding. Default `4`. */
  padding?: '0' | '2' | '3' | '4' | '6' | '8';
  /** Border radius. Default `md`. */
  radius?: 'none' | 'sm' | 'md' | 'lg';
  /** Surface background — `card` (raised) or `muted` (recessed). Default `card`. */
  surface?: 'card' | 'muted' | 'transparent';
  /** Show the border. Default `true`. */
  bordered?: boolean;
}

const PADDING: Record<NonNullable<FrameProps['padding']>, string> = {
  '0': '', '2': 'p-2', '3': 'p-3', '4': 'p-4', '6': 'p-6', '8': 'p-8',
};
const RADIUS: Record<NonNullable<FrameProps['radius']>, string> = {
  none: '', sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg',
};
const SURFACE: Record<NonNullable<FrameProps['surface']>, string> = {
  card: 'bg-card text-card-foreground',
  muted: 'bg-muted text-foreground',
  transparent: '',
};

/**
 * Bordered shell with padding + radius — `Card` without slot semantics.
 * Use when you want the visual but not the structured Header/Body/Footer.
 */
export const Frame = forwardRef<HTMLDivElement, FrameProps>(
  ({ padding = '4', radius = 'md', surface = 'card', bordered = true, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        SURFACE[surface],
        PADDING[padding],
        RADIUS[radius],
        bordered && 'border border-border',
        className,
      )}
      {...props}
    />
  ),
);
Frame.displayName = 'Frame';
