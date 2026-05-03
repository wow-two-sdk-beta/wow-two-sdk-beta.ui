import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';

export interface TrendIndicatorProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Numeric delta — sign drives direction. */
  value: number;
  /** Optional formatter (default: `${sign}${value}%`). */
  format?: (value: number) => ReactNode;
  /** When `true`, an increase reads as bad (e.g. error rate, churn). */
  inverse?: boolean;
  /** Small trailing label, e.g. "vs last week". */
  label?: ReactNode;
  size?: 'xs' | 'sm' | 'md';
}

const SIZE_TEXT: Record<NonNullable<TrendIndicatorProps['size']>, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
};
const SIZE_ICON: Record<NonNullable<TrendIndicatorProps['size']>, number> = {
  xs: 12,
  sm: 14,
  md: 16,
};

/**
 * Up / down / flat arrow + value + optional label. Used inside `Stat` and
 * dashboard tiles. Pass `inverse` for metrics where higher is worse.
 */
export const TrendIndicator = forwardRef<HTMLSpanElement, TrendIndicatorProps>(
  ({ value, format, inverse, label, size = 'sm', className, ...props }, ref) => {
    const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
    const positive =
      direction === 'flat' ? false : (direction === 'up') !== Boolean(inverse);
    const tone =
      direction === 'flat' ? 'text-muted-foreground' : positive ? 'text-success' : 'text-destructive';
    const arrow = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
    const display = format ? format(value) : `${value > 0 ? '+' : ''}${value}%`;
    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-1 font-medium', SIZE_TEXT[size], tone, className)}
        {...props}
      >
        <Icon icon={arrow} size={SIZE_ICON[size]} />
        {display}
        {label && <span className="text-muted-foreground"> {label}</span>}
      </span>
    );
  },
);
TrendIndicator.displayName = 'TrendIndicator';
