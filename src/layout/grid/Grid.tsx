import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type Ref,
} from 'react';
import { cn } from '../../utils';
import { gridVariants, type GridVariants } from './Grid.variants';

export interface GridProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'as'>,
    GridVariants {
  as?: ElementType;
}

/**
 * CSS grid container with column and gap variants. For non-uniform tracks
 * pass an explicit `style={{ gridTemplateColumns }}` — the variant covers
 * the equal-column case.
 */
export const Grid = forwardRef<HTMLElement, GridProps>(
  ({ as: Component = 'div', className, columns, gap, ...props }, ref) => (
    <Component
      ref={ref as Ref<HTMLElement>}
      className={cn(gridVariants({ columns, gap }), className)}
      {...props}
    />
  ),
);
Grid.displayName = 'Grid';
