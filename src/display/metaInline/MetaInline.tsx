import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Inline } from '../../layout/inline';

export interface MetaInlineProps extends ComponentPropsWithoutRef<'div'> {
  /** Right-aligned slot — typically small action buttons. */
  actions?: ReactNode;
  /** Gap between left-side meta items. Default `2`. */
  gap?: '1' | '2' | '3';
}

/**
 * Horizontal inline row of meta items (Badges, MetricChips, Status, etc.)
 * + an optional trailing actions slot. Captures the recurring "meta row"
 * pattern in drawer/card bodies — badges left, action buttons right.
 */
export const MetaInline = forwardRef<HTMLDivElement, MetaInlineProps>(
  ({ actions, gap = '2', children, className, ...props }, ref) => (
    <Inline
      ref={ref}
      gap={gap}
      className={cn('w-full', className)}
      {...props}
    >
      {children}
      {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
    </Inline>
  ),
);
MetaInline.displayName = 'MetaInline';
