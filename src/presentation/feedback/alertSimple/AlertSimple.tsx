import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn, type Severity } from '../../../foundation/utils';
import { alertSimpleVariants, type AlertSimpleVariants } from './AlertSimple.variants';

export interface AlertSimpleProps
  extends ComponentPropsWithoutRef<'div'>,
    Omit<AlertSimpleVariants, 'severity'> {
  /** The semantic severity palette. */
  severity?: Severity;
}

/**
 * Atomic alert — a styled colored container that takes free-form `children`.
 * No internal slots; consumer composes title/description/actions inline.
 *
 * For the structured Icon + Title + Description + Actions composition use
 * the `Alert` molecule (L4).
 */
export const AlertSimple = forwardRef<HTMLDivElement, AlertSimpleProps>(
  ({ className, severity, role = 'status', ...props }, ref) => (
    <div
      ref={ref}
      role={role}
      className={cn(alertSimpleVariants({ severity }), className)}
      {...props}
    />
  ),
);
AlertSimple.displayName = 'AlertSimple';
