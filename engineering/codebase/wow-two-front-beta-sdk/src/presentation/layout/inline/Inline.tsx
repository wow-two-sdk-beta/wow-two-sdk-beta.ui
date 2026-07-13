import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../../foundation/utils';

/**
 * Defines the cross-axis alignment of `Inline` children. Diverges from the shared
 * `Align` (adds `Baseline`), so it stays a local enum.
 */
export const InlineAlign = {
  /** Refers to alignment at the cross-axis start. */
  Start: 'start',
  /** Refers to centered cross-axis alignment. */
  Center: 'center',
  /** Refers to alignment at the cross-axis end. */
  End: 'end',
  /** Refers to baseline alignment of children. */
  Baseline: 'baseline',
} as const;

export type InlineAlign = (typeof InlineAlign)[keyof typeof InlineAlign];

export interface InlineProps extends ComponentPropsWithoutRef<'div'> {
  /** The gap between children (Tailwind spacing). Default `2`. */
  gap?: '0' | '1' | '2' | '3' | '4' | '6' | '8';

  /** The vertical alignment. Default `center`. */
  align?: InlineAlign;

  /**
   * The child wrapping onto multiple lines. Default `true` (`flex-wrap`).
   * Set `false` (`flex-nowrap`) for tight single-line rows that should truncate.
   */
  wrap?: boolean;
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
  ({ gap = '2', align = InlineAlign.Center, wrap = true, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex',
        wrap ? 'flex-wrap' : 'flex-nowrap',
        GAP[gap],
        ALIGN[align],
        className,
      )}
      {...props}
    />
  ),
);
Inline.displayName = 'Inline';
