import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import { toastSimpleVariants, type ToastSimpleVariants } from './ToastSimple.variants';

export interface ToastSimpleProps
  extends ComponentPropsWithoutRef<'div'>,
    ToastSimpleVariants {}

/**
 * Atomic toast — a single notification card with free-form `children`.
 * Visual only; the queue / portal manager (`Toaster`) lives at L5. For
 * the structured Icon + Title + Description + Action layout, use the
 * `Toast` molecule (L4).
 */
export const ToastSimple = forwardRef<HTMLDivElement, ToastSimpleProps>(
  ({ className, severity, role = 'status', ...props }, ref) => (
    <div
      ref={ref}
      role={role}
      aria-live="polite"
      className={cn(toastSimpleVariants({ severity }), className)}
      {...props}
    />
  ),
);
ToastSimple.displayName = 'ToastSimple';
