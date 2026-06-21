import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Backdrop } from '../../overlays/backdrop';
import { Spinner } from '../spinner';
import type { SpinnerVariants } from '../spinner/Spinner.variants';

export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  label?: ReactNode;
  /** Position the scrim absolutely inside the parent (parent must be `position: relative`). */
  isInline?: boolean;
  hasBlur?: boolean;
  spinnerSize?: SpinnerVariants['size'];
  spinnerTone?: SpinnerVariants['tone'];
}

/**
 * Scrim + centered spinner — blocks interaction with a region during a long task.
 * `isInline` scopes the scrim to a `position: relative` parent; default covers the
 * viewport via `Backdrop`.
 */
export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  function LoadingOverlay(
    {
      isOpen = true,
      label = 'Loading…',
      isInline = false,
      hasBlur,
      spinnerSize = 'lg',
      spinnerTone = 'brand',
      className,
      children,
      ...rest
    },
    ref,
  ) {
    if (!isOpen) return null;

    if (isInline) {
      return (
        <div
          ref={ref}
          role="status"
          className={cn(
            'absolute inset-0 z-banner flex flex-col items-center justify-center gap-3 bg-background/70',
            hasBlur && 'backdrop-blur-sm',
            className,
          )}
          {...rest}
        >
          <Spinner size={spinnerSize} tone={spinnerTone} label={typeof label === 'string' ? label : 'Loading'} />
          {label && <div className="text-sm text-foreground">{label}</div>}
          {children}
        </div>
      );
    }

    return (
      <>
        <Backdrop open isBlurred={hasBlur} className="bg-background/70" />
        <div
          ref={ref}
          role="status"
          className={cn(
            'fixed inset-0 z-modal flex flex-col items-center justify-center gap-3 pointer-events-none',
            className,
          )}
          {...rest}
        >
          <Spinner size={spinnerSize} tone={spinnerTone} label={typeof label === 'string' ? label : 'Loading'} />
          {label && <div className="text-sm text-foreground">{label}</div>}
          {children}
        </div>
      </>
    );
  },
);
LoadingOverlay.displayName = 'LoadingOverlay';
