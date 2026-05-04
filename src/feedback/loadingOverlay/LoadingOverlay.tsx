import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Backdrop } from '../../overlays/backdrop';
import { Spinner } from '../spinner';
import type { SpinnerVariants } from '../spinner/Spinner.variants';

export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  label?: ReactNode;
  /** Position the scrim absolutely inside the parent (parent must be `position: relative`). */
  inline?: boolean;
  blur?: boolean;
  spinnerSize?: SpinnerVariants['size'];
  spinnerTone?: SpinnerVariants['tone'];
}

/**
 * Scrim + centered spinner. Use to block interaction with a region while a
 * long-running task is in flight. `inline` positions the scrim inside its
 * parent (which must be `position: relative`); the default covers the
 * viewport via `Backdrop`.
 */
export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  function LoadingOverlay(
    {
      open = true,
      label = 'Loading…',
      inline = false,
      blur,
      spinnerSize = 'lg',
      spinnerTone = 'brand',
      className,
      children,
      ...rest
    },
    ref,
  ) {
    if (!open) return null;

    if (inline) {
      return (
        <div
          ref={ref}
          role="alert"
          aria-busy="true"
          className={cn(
            'absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-background/70',
            blur && 'backdrop-blur-sm',
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
        <Backdrop open blur={blur} className="bg-background/70" />
        <div
          ref={ref}
          role="alert"
          aria-busy="true"
          className={cn(
            'fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 pointer-events-none',
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
