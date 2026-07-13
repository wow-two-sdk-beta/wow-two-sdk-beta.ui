import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type Ref,
} from 'react';
import { cn } from '../../../foundation/utils';
import {
  stackVariants,
  type StackVariants,
  type StackDirection,
  type StackAlign,
  type StackJustify,
  type StackWrap,
} from './Stack.variants';

export interface StackProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'as'>,
    Omit<StackVariants, 'direction' | 'align' | 'justify' | 'wrap'> {
  as?: ElementType;
  /** The flex main-axis direction. Default `column`. */
  direction?: StackDirection;
  /** The cross-axis alignment of children. */
  align?: StackAlign;
  /** The main-axis distribution of children. */
  justify?: StackJustify;
  /** The child wrapping onto multiple lines. */
  wrap?: StackWrap;
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
