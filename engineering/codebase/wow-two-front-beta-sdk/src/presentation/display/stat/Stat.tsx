import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';
import { Heading } from '../heading/Heading';
import { Text } from '../text/Text';

/** Defines the Stat tile visual size. */
export const StatSize = {
  /** Refers to the small tile. */
  Sm: 'sm',
  /** Refers to the medium tile. */
  Md: 'md',
  /** Refers to the large tile. */
  Lg: 'lg',
} as const;

export type StatSize = (typeof StatSize)[keyof typeof StatSize];

export interface StatProps extends ComponentPropsWithoutRef<'div'> {
  /** The label above the value. */
  label: ReactNode;

  /** The primary value (large). */
  value: ReactNode;

  /** The optional trend — positive = up/green, negative = down/red. */
  trend?: { value: number; label?: ReactNode };

  /** The optional helper / supporting text below. */
  helper?: ReactNode;

  /** The visual size. Default `md`. */
  size?: StatSize;
}

const VALUE_SIZE: Record<NonNullable<StatProps['size']>, '2xl' | '3xl' | '4xl'> = {
  sm: '2xl',
  md: '3xl',
  lg: '4xl',
};

/**
 * Single metric tile — label + big value + optional trend + helper. Use
 * inside dashboards / KPI grids.
 */
export const Stat = forwardRef<HTMLDivElement, StatProps>(
  ({ label, value, trend, helper, size = 'md', className, ...props }, ref) => {
    const trendUp = trend ? trend.value >= 0 : false;
    return (
      <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props}>
        <Text size="sm" color="muted">{label}</Text>
        <Heading level={3} size={VALUE_SIZE[size]} weight="bold">{value}</Heading>
        {(trend || helper) && (
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  trendUp ? 'text-success' : 'text-destructive',
                )}
              >
                <Icon icon={trendUp ? TrendingUp : TrendingDown} size={12} />
                {trend.value > 0 ? '+' : ''}{trend.value}%
                {trend.label && <span className="text-muted-foreground"> {trend.label}</span>}
              </span>
            )}
            {helper && !trend && <Text size="xs" color="muted">{helper}</Text>}
          </div>
        )}
      </div>
    );
  },
);
Stat.displayName = 'Stat';
