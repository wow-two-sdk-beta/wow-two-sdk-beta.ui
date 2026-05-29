import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn, surfaceVariants } from '../../utils';
import type { Tone } from '../../utils';
import type { ToastSimpleVariants } from './ToastSimple.variants';

/** Represents the prop surface of `ToastSimple`. */
export interface ToastSimpleProps
  extends ComponentPropsWithoutRef<'div'>,
    ToastSimpleVariants {}

/** Maps the toast `severity` keyword to a SurfaceStyles `tone`. */
const SEVERITY_TO_TONE: Record<NonNullable<ToastSimpleVariants['severity']>, Tone> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  neutral: 'neutral',
};

/** Provides the atomic toast card — single tone-driven notification with free-form children. */
export const ToastSimple = forwardRef<HTMLDivElement, ToastSimpleProps>(
  ({ className, severity = 'neutral', role = 'status', ...props }, ref) => (
    <div
      ref={ref}
      role={role}
      aria-live="polite"
      className={cn(
        'pointer-events-auto text-sm',
        surfaceVariants({
          variant: 'surface',
          tone: SEVERITY_TO_TONE[severity],
          radius: 'md',
          padding: 'md',
          elevation: 3,
        }),
        className,
      )}
      {...props}
    />
  ),
);
ToastSimple.displayName = 'ToastSimple';
