import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import { spinnerVariants, type SpinnerVariants } from './Spinner.variants';

export interface SpinnerProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'>,
    SpinnerVariants {
  /** Accessible label. Default `"Loading"`. */
  label?: string;
}

/**
 * Indeterminate loading spinner. Renders a spinning circle and a visually
 * hidden text label for screen readers.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size, tone, label = 'Loading', role = 'status', ...props }, ref) => (
    <span ref={ref} role={role} {...props}>
      <span className={cn(spinnerVariants({ size, tone }), className)} />
      <span className="sr-only">{label}</span>
    </span>
  ),
);
Spinner.displayName = 'Spinner';
