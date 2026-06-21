import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type Ref,
} from 'react';
import { cn } from '../../utils';
import {
  resolveGridColumns,
  resolveGridGap,
  type GridColumns,
  type GridGap,
  type GridResponsive,
} from './Grid.variants';

export interface GridProps extends Omit<ComponentPropsWithoutRef<'div'>, 'as'> {
  as?: ElementType;
  /**
   * Equal-column track count. Scalar (`'3'`) emits `grid-cols-3`; a responsive
   * map (`{ base: '1', md: '2', lg: '3' }`) emits per-breakpoint prefixed
   * classes. Default `'2'`.
   */
  columns?: GridColumns | GridResponsive<GridColumns>;
  /**
   * Gap between tracks. Scalar (`'4'`) emits `gap-4`; a responsive map
   * (`{ base: '2', lg: '6' }`) emits per-breakpoint prefixed classes. Default `'4'`.
   */
  gap?: GridGap | GridResponsive<GridGap>;
}

/**
 * CSS grid container with column and gap variants. Both `columns` and `gap`
 * accept a scalar value or a responsive `{ base, sm, md, lg, xl }` map. For
 * non-uniform tracks pass an explicit `style={{ gridTemplateColumns }}` — the
 * variant covers the equal-column case.
 */
export const Grid = forwardRef<HTMLElement, GridProps>(
  ({ as: Component = 'div', className, columns = '2', gap = '4', ...props }, ref) => (
    <Component
      ref={ref as Ref<HTMLElement>}
      className={cn(
        'grid',
        resolveGridColumns(columns),
        resolveGridGap(gap),
        className,
      )}
      {...props}
    />
  ),
);
Grid.displayName = 'Grid';
