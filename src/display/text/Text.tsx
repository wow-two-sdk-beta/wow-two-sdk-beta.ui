import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type Ref,
} from 'react';
import { cn } from '../../utils';
import { textVariants, type TextVariants } from './Text.variants';

export interface TextProps
  extends Omit<ComponentPropsWithoutRef<'p'>, 'as' | 'color'>,
    TextVariants {
  as?: ElementType;
}

/**
 * Body text. Renders as `<p>` by default; pass `as="span"` (or any element)
 * to keep semantics consistent with the surrounding markup.
 */
export const Text = forwardRef<HTMLElement, TextProps>(
  ({ as: Component = 'p', className, size, weight, color, align, truncate, ...props }, ref) => (
    <Component
      ref={ref as Ref<HTMLElement>}
      className={cn(textVariants({ size, weight, color, align, truncate }), className)}
      {...props}
    />
  ),
);
Text.displayName = 'Text';
