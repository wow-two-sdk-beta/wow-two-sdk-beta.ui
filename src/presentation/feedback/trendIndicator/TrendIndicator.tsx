import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn, Size } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';

export interface TrendIndicatorProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** The numeric delta — sign drives direction. */
  value: number;

  /** The optional value formatter (default: `${sign}${value}%`). */
  format?: (value: number) => ReactNode;

  /** The inverse-direction flag — when `true`, an increase reads as bad (e.g. error rate, churn). */
  isInverse?: boolean;

  /** The small trailing label, e.g. "vs last week". */
  label?: ReactNode;

  /** The text + icon scale. */
  size?: Size;
}

/* Only xs/sm/md carry a scale; other `Size` members fall through to `md` at
   the lookup below. */
const SIZE_TEXT: Partial<Record<Size, string>> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
};
const SIZE_ICON: Partial<Record<Size, number>> = {
  xs: 12,
  sm: 14,
  md: 16,
};

/**
 * Up / down / flat arrow + value + optional label. Used inside `Stat` and
 * dashboard tiles. Pass `isInverse` for metrics where higher is worse.
 */
export const TrendIndicator = forwardRef<HTMLSpanElement, TrendIndicatorProps>(
  ({ value, format, isInverse, label, size = Size.Sm, className, ...props }, ref) => {
    const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
    const positive =
      direction === 'flat' ? false : (direction === 'up') !== Boolean(isInverse);
    const tone =
      direction === 'flat' ? 'text-muted-foreground' : positive ? 'text-success' : 'text-destructive';
    const arrow = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
    const display = format ? format(value) : `${value > 0 ? '+' : ''}${value}%`;
    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-1 font-medium', SIZE_TEXT[size] ?? SIZE_TEXT.md, tone, className)}
        {...props}
      >
        <Icon icon={arrow} size={SIZE_ICON[size] ?? SIZE_ICON.md} />
        {display}
        {label && <span className="text-muted-foreground"> {label}</span>}
      </span>
    );
  },
);
TrendIndicator.displayName = 'TrendIndicator';
