import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type Ref,
} from 'react';
import { cn, type Size } from '../../../foundation/utils';
import {
  textVariants,
  type TextAlign,
  type TextColor,
  type TextVariants,
  type TextWeight,
} from './Text.variants';

export interface TextProps
  extends Omit<ComponentPropsWithoutRef<'p'>, 'as' | 'color'>,
    Omit<TextVariants, 'size' | 'weight' | 'color' | 'align'> {
  as?: ElementType;
  /** The font size step. */
  size?: Size;
  /** The font weight. */
  weight?: TextWeight;
  /** The color role. */
  color?: TextColor;
  /** The text alignment. */
  align?: TextAlign;
}

/**
 * Body text. Renders as `<p>` by default; pass `as="span"` (or any element)
 * to keep semantics consistent with the surrounding markup.
 */
export const Text = forwardRef<HTMLElement, TextProps>(
  ({ as: Component = 'p', className, size, weight, color, align, isTruncated, isTabular, ...props }, ref) => (
    <Component
      ref={ref as Ref<HTMLElement>}
      className={cn(textVariants({ size, weight, color, align, isTruncated, isTabular }), className)}
      {...props}
    />
  ),
);
Text.displayName = 'Text';
