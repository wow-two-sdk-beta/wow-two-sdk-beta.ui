import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn, Side } from '../../../foundation/utils';

export interface TwoColumnProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The sidebar / aside content. */
  aside: ReactNode;

  /** The main content. */
  children: ReactNode;

  /** The aside width — Tailwind class string (e.g. `w-64`). Default `w-64`. */
  asideWidth?: string;

  /** The side the aside sits on — `left` or `right`. Default `left`. */
  asideSide?: Side;

  /** The gap between aside and main. Default `6`. */
  gap?: '0' | '4' | '6' | '8' | '10';
}

const GAP: Record<NonNullable<TwoColumnProps['gap']>, string> = {
  '0': 'gap-0', '4': 'gap-4', '6': 'gap-6', '8': 'gap-8', '10': 'gap-10',
};

/**
 * Two-pane layout — fixed-width aside + flexible main. Sidebar+content,
 * filter+results, table-of-contents+article patterns.
 */
export const TwoColumn = forwardRef<HTMLDivElement, TwoColumnProps>(
  (
    { aside, children, asideWidth = 'w-64', asideSide = Side.Left, gap = '6', className, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        'flex w-full',
        asideSide === Side.Right && 'flex-row-reverse',
        GAP[gap],
        className,
      )}
      {...props}
    >
      <aside className={cn('shrink-0', asideWidth)}>{aside}</aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  ),
);
TwoColumn.displayName = 'TwoColumn';
