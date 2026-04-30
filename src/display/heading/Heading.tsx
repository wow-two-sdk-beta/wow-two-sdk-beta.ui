import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import { headingVariants, type HeadingVariants } from './Heading.variants';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps
  extends Omit<ComponentPropsWithoutRef<'h2'>, 'size'>,
    HeadingVariants {
  /** Semantic heading level (1–6). Default 2. Visual size is independent — set via `size`. */
  level?: HeadingLevel;
}

/**
 * Semantic heading. `level` controls the rendered tag (`h1`–`h6`); `size`
 * controls the visual scale independently — so a visually-large heading
 * can still be the right outline level.
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 2, className, size, weight, align, ...props }, ref) => {
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    return (
      <Tag
        ref={ref}
        className={cn(headingVariants({ size, weight, align }), className)}
        {...props}
      />
    );
  },
);
Heading.displayName = 'Heading';
