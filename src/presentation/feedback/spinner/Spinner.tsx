import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn, type Size } from '../../../foundation/utils';
import { spinnerVariants, type SpinnerTone, type SpinnerVariants } from './Spinner.variants';

export interface SpinnerProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'>,
    Omit<SpinnerVariants, 'size' | 'tone'> {
  /** The diameter step. */
  size?: Size;
  /** The color tone. */
  tone?: SpinnerTone;
  /** The accessible label. Default `"Loading"`. */
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
