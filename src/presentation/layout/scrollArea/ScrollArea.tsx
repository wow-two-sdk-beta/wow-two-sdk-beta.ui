import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../../foundation/utils';

/**
 * Defines the scroll axis of a `ScrollArea`. Diverges from the shared
 * `Orientation` (adds `Both`), so it stays a local enum.
 */
export const ScrollAxis = {
  /** Refers to vertical scrolling only. */
  Vertical: 'vertical',
  /** Refers to horizontal scrolling only. */
  Horizontal: 'horizontal',
  /** Refers to scrolling on both axes. */
  Both: 'both',
} as const;

export type ScrollAxis = (typeof ScrollAxis)[keyof typeof ScrollAxis];

export interface ScrollAreaProps extends ComponentPropsWithoutRef<'div'> {
  /** The scroll axis. Default `vertical`. */
  axis?: ScrollAxis;
}

/**
 * Native scrollable container with stable visuals. For custom-styled
 * scrollbars (track + thumb separately animated) use the L5 ScrollArea
 * organism. This atom exists for the common case.
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ axis = ScrollAxis.Vertical, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative',
        axis === ScrollAxis.Vertical && 'overflow-y-auto overflow-x-hidden',
        axis === ScrollAxis.Horizontal && 'overflow-x-auto overflow-y-hidden',
        axis === ScrollAxis.Both && 'overflow-auto',
        className,
      )}
      {...props}
    />
  ),
);
ScrollArea.displayName = 'ScrollArea';
