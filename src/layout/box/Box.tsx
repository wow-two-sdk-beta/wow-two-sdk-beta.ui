import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type Ref } from 'react';
import { cn } from '../../utils';

export interface BoxProps extends Omit<ComponentPropsWithoutRef<'div'>, 'as'> {
  /** HTML element to render. Default `div`. */
  as?: ElementType;
}

/**
 * The lowest-level layout primitive. Renders any element (default `div`)
 * with className passthrough. Use as a styling shell when no other layout
 * atom fits.
 */
export const Box = forwardRef<HTMLElement, BoxProps>(
  ({ as: Component = 'div', className, ...props }, ref) => (
    <Component ref={ref as Ref<HTMLElement>} className={cn(className)} {...props} />
  ),
);
Box.displayName = 'Box';
