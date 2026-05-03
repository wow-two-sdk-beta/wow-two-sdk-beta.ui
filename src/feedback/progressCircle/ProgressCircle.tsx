import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface ProgressCircleProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** 0–100. Omit for indeterminate. */
  value?: number;
  max?: number;
  size?: number;
  thickness?: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  label?: string;
}

const TONE_CLASS: Record<NonNullable<ProgressCircleProps['tone']>, string> = {
  brand: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  neutral: 'text-muted-foreground',
};

/**
 * Circular progress indicator (SVG). Determinate when `value` is set;
 * indeterminate (rotating) when omitted.
 */
export const ProgressCircle = forwardRef<HTMLDivElement, ProgressCircleProps>(
  (
    { value, max = 100, size = 40, thickness = 4, tone = 'brand', label, className, ...props },
    ref,
  ) => {
    const determinate = typeof value === 'number';
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = determinate ? Math.min(100, Math.max(0, (value / max) * 100)) : 25;
    const offset = circumference - (pct / 100) * circumference;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={determinate ? value : undefined}
        className={cn('inline-block', !determinate && 'animate-spin', TONE_CLASS[tone], className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={thickness}
            fill="none"
            opacity={0.2}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={thickness}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 300ms ease' }}
          />
        </svg>
      </div>
    );
  },
);
ProgressCircle.displayName = 'ProgressCircle';
