import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface ScrollAreaProps extends ComponentPropsWithoutRef<'div'> {
  axis?: 'vertical' | 'horizontal' | 'both';
}

/**
 * Native scrollable container with stable visuals. For custom-styled
 * scrollbars (track + thumb separately animated) use the L5 ScrollArea
 * organism. This atom exists for the common case.
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ axis = 'vertical', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative',
        axis === 'vertical' && 'overflow-y-auto overflow-x-hidden',
        axis === 'horizontal' && 'overflow-x-auto overflow-y-hidden',
        axis === 'both' && 'overflow-auto',
        className,
      )}
      {...props}
    />
  ),
);
ScrollArea.displayName = 'ScrollArea';
