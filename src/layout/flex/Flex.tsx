import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type Ref,
} from 'react';
import { cn } from '../../utils';

export interface FlexProps extends Omit<ComponentPropsWithoutRef<'div'>, 'as'> {
  as?: ElementType;
}

/**
 * Bare flex container — no opinions on direction, gap, or alignment.
 * Use for one-off flex layouts that don't fit `Stack`'s variant matrix.
 */
export const Flex = forwardRef<HTMLElement, FlexProps>(
  ({ as: Component = 'div', className, ...props }, ref) => (
    <Component
      ref={ref as Ref<HTMLElement>}
      className={cn('flex', className)}
      {...props}
    />
  ),
);
Flex.displayName = 'Flex';
