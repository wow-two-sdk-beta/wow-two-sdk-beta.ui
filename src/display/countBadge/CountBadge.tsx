import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import { Badge, type BadgeProps } from '../badge/Badge';

export interface CountBadgeProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** The numeric count. */
  value: number;
  /** Cap value — shows "max+" when exceeded. Default 99. */
  max?: number;
  /** Hide entirely when count is 0. Default true. */
  hideZero?: boolean;
  variant?: BadgeProps['variant'];
}

/**
 * Numeric badge for notification / inbox counts. Displays "{value}" or
 * "{max}+" once the cap is exceeded. Hides when `value === 0` unless
 * `hideZero={false}`.
 */
export const CountBadge = forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({ value, max = 99, hideZero = true, variant = 'danger', className, ...props }, ref) => {
    if (value === 0 && hideZero) return null;
    const display = value > max ? `${max}+` : `${value}`;
    return (
      <Badge
        ref={ref}
        variant={variant}
        size="sm"
        className={cn('min-w-5 justify-center px-1.5', className)}
        {...props}
      >
        {display}
      </Badge>
    );
  },
);
CountBadge.displayName = 'CountBadge';
