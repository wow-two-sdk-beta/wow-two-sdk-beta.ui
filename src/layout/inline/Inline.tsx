import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface InlineProps extends ComponentPropsWithoutRef<'div'> {
  /** Gap between children (Tailwind spacing). Default `2`. */
  gap?: '0' | '1' | '2' | '3' | '4' | '6' | '8';
  /** Vertical alignment. Default `center`. */
  align?: 'start' | 'center' | 'end' | 'baseline';
}

const GAP: Record<NonNullable<InlineProps['gap']>, string> = {
  '0': 'gap-0', '1': 'gap-1', '2': 'gap-2', '3': 'gap-3', '4': 'gap-4', '6': 'gap-6', '8': 'gap-8',
};
const ALIGN: Record<NonNullable<InlineProps['align']>, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
};

/**
 * Wrapping horizontal row with consistent gap. Use for chips/tag rows,
 * inline button groups, breadcrumb-like sequences.
 */
export const Inline = forwardRef<HTMLDivElement, InlineProps>(
  ({ gap = '2', align = 'center', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-wrap', GAP[gap], ALIGN[align], className)}
      {...props}
    />
  ),
);
Inline.displayName = 'Inline';
