import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Presence } from '../../primitives';
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
    const content = (
      <>
        <Spinner size={spinnerSize} tone={spinnerTone} label={typeof label === 'string' ? label : 'Loading'} />
        {label && <div className="text-sm text-foreground">{label}</div>}
        {children}
      </>
    );

    if (isInline) {
      // `Presence` defers unmount until the exit fade ends, cloning `data-state`
      // + `ref` onto the scrim below (forwardRef + `{...props}` spread required).
      return (
        <Presence isPresent={isOpen}>
          <LoadingScrim
            ref={ref}
            className={cn(
              'absolute inset-0 z-banner bg-background/70',
              hasBlur && 'backdrop-blur-sm',
              className,
            )}
            {...rest}
          >
            {content}
          </LoadingScrim>
        </Presence>
      );
    }

    return (
      <>
        {/* Backdrop self-wraps in `Presence`; driving `open` with `isOpen` lets its
            fade-out play before it defers its own unmount. */}
        <Backdrop open={isOpen} isBlurred={hasBlur} className="bg-background/70" />
        <Presence isPresent={isOpen}>
          <LoadingScrim
            ref={ref}
            className={cn(
              'fixed inset-0 z-modal pointer-events-none',
              className,
            )}
            {...rest}
          >
            {content}
          </LoadingScrim>
        </Presence>
      </>
    );
  },
);
LoadingOverlay.displayName = 'LoadingOverlay';

/**
 * `Presence`-clonable scrim: a single `forwardRef` element that spreads the
 * injected `data-state` ("open" | "closed") onto its node and runs the fade off
 * it. `forwardRef` + `{...props}` spread are required so the `ref` and
 * `data-state` actually land here (it's the node `Presence` watches for
 * `animationend`). `motion-safe`/`motion-reduce` honour reduced-motion.
 */
const LoadingScrim = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function LoadingScrim({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="status"
        className={cn(
          'flex flex-col items-center justify-center gap-3',
          'motion-safe:data-[state=open]:animate-(--animate-fade-in)',
          'motion-safe:data-[state=closed]:animate-(--animate-fade-out)',
          'motion-reduce:animate-none',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
LoadingScrim.displayName = 'LoadingScrim';
