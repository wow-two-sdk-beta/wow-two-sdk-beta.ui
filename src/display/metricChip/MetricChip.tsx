import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';

export interface MetricChipProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Optional leading icon (tone-tinted via the `tone` prop). */
  icon?: ReactNode;
  /** Uppercase mini-LABEL rendered after the icon. */
  label: ReactNode;
  /** Value rendered after the label, tabular-nums. */
  value: ReactNode;
  /** Tone tinting for the icon. Default `neutral`. */
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  /** Visual size — drives gap + text-size token. Default `sm`. */
  size?: 'xs' | 'sm' | 'md';
}

const TONE: Record<NonNullable<MetricChipProps['tone']>, string> = {
  neutral: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  info: 'text-info',
};

const SIZE: Record<
  NonNullable<MetricChipProps['size']>,
  { wrapper: string; label: string; value: string }
> = {
  xs: { wrapper: 'gap-1 text-[10px]', label: 'text-[10px]', value: 'text-xs' },
  sm: { wrapper: 'gap-1.5 text-xs', label: 'text-xs', value: 'text-xs' },
  md: { wrapper: 'gap-2 text-sm', label: 'text-xs', value: 'text-sm' },
};

/**
 * Horizontal label-value chip with a leading tone-tinted icon and an
 * uppercase mini-LABEL. Used for stat strips. Distinct from `Stat` (large
 * KPI tile), `InfoRow` (justify-between two-column row), and `Status`
 * (dot+text). Renders inline-flex.
 */
export const MetricChip = forwardRef<HTMLSpanElement, MetricChipProps>(
  ({ icon, label, value, tone = 'neutral', size = 'sm', className, ...props }, ref) => {
    const sz = SIZE[size];
    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center', sz.wrapper, className)}
        {...props}
      >
        {icon && <span className={cn('inline-flex shrink-0 items-center', TONE[tone])}>{icon}</span>}
        <span className={cn('font-medium uppercase tracking-wide text-muted-foreground', sz.label)}>
          {label}
        </span>
        <span className={cn('tabular-nums text-foreground', sz.value)}>{value}</span>
      </span>
    );
  },
);
MetricChip.displayName = 'MetricChip';
