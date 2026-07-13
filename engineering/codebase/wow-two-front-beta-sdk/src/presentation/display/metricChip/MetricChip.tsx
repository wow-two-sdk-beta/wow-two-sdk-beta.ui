import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../../foundation/utils';

/** Defines the MetricChip icon tint tone. */
export const MetricChipTone = {
  /** Refers to the neutral tint. */
  Neutral: 'neutral',
  /** Refers to the positive / confirmation tint. */
  Success: 'success',
  /** Refers to the caution tint. */
  Warning: 'warning',
  /** Refers to the destructive / error tint. */
  Danger: 'danger',
  /** Refers to the informational tint. */
  Info: 'info',
} as const;

export type MetricChipTone = (typeof MetricChipTone)[keyof typeof MetricChipTone];

/** Defines the MetricChip visual size. */
export const MetricChipSize = {
  /** Refers to the extra-small chip. */
  Xs: 'xs',
  /** Refers to the small chip. */
  Sm: 'sm',
  /** Refers to the medium chip. */
  Md: 'md',
} as const;

export type MetricChipSize = (typeof MetricChipSize)[keyof typeof MetricChipSize];

export interface MetricChipProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** The optional leading icon (tone-tinted via the `tone` prop). */
  icon?: ReactNode;

  /** The uppercase mini-LABEL rendered after the icon. */
  label: ReactNode;

  /** The value rendered after the label, tabular-nums. */
  value: ReactNode;

  /** The tone tinting for the icon. Default `neutral`. */
  tone?: MetricChipTone;

  /** The visual size — drives gap + text-size token. Default `sm`. */
  size?: MetricChipSize;
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
