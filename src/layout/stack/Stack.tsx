import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type Ref,
} from 'react';
import { cn } from '../../utils';
import { stackVariants, type StackVariants } from './Stack.variants';

export interface StackProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'as'>,
    StackVariants {
  as?: ElementType;
}

/**
 * Vertical (default) or horizontal flex container with gap and alignment
 * variants. For row preset use `HStack`, for column use `VStack`.
 */
export const Stack = forwardRef<HTMLElement, StackProps>(
  ({ as: Component = 'div', className, direction, align, justify, gap, wrap, ...props }, ref) => (
    <Component
      ref={ref as Ref<HTMLElement>}
      className={cn(stackVariants({ direction, align, justify, gap, wrap }), className)}
      {...props}
    />
  ),
);
Stack.displayName = 'Stack';
