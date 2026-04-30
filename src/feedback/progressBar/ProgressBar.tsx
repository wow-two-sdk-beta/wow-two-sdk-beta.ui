import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import {
  progressFillVariants,
  progressTrackVariants,
  type ProgressBarVariants,
} from './ProgressBar.variants';

export interface ProgressBarProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>,
    ProgressBarVariants {
  /** Current value 0–100. Pass `undefined` for indeterminate. */
  value?: number;
  max?: number;
  /** Accessible label for the progress. */
  label?: string;
}

/**
 * Linear progress indicator. Set `value` (0–`max`) for determinate; omit
 * for indeterminate.
 */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max = 100, size, tone, label, className, ...props }, ref) => {
    const determinate = typeof value === 'number';
    const pct = determinate ? Math.min(100, Math.max(0, (value / max) * 100)) : undefined;
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={determinate ? value : undefined}
        className={cn(progressTrackVariants({ size }), className)}
        {...props}
      >
        <div
          className={cn(
            progressFillVariants({ tone }),
            !determinate && 'w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite]',
          )}
          style={determinate ? { width: `${pct}%` } : undefined}
        />
      </div>
    );
  },
);
ProgressBar.displayName = 'ProgressBar';
