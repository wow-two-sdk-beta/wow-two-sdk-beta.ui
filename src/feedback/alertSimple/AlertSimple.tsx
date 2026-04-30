import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import { alertSimpleVariants, type AlertSimpleVariants } from './AlertSimple.variants';

export interface AlertSimpleProps
  extends ComponentPropsWithoutRef<'div'>,
    AlertSimpleVariants {}

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
