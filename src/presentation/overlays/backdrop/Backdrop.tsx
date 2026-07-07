import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../../foundation/utils';
import { Portal, Presence } from '../../../foundation/primitives';

/** Defines the pointer-event behavior of a `Backdrop` scrim. */
export const BackdropPointerEvents = {
  /** Refers to a scrim that intercepts pointer events. */
  Auto: 'auto',
  /** Refers to a scrim that lets clicks pass through. */
  None: 'none',
} as const;

export type BackdropPointerEvents = (typeof BackdropPointerEvents)[keyof typeof BackdropPointerEvents];

export interface BackdropProps extends HTMLAttributes<HTMLDivElement> {
  /** The mount state. Default `true`. */
  open?: boolean;

  /** The backdrop-blur toggle. */
  isBlurred?: boolean;

  /** The pointer-event behavior; `'none'` lets clicks pass through. Default `'auto'`. */
  pointerEvents?: BackdropPointerEvents;

  /** The in-place render toggle — skips the Portal wrap. */
  isInline?: boolean;
}

/** Fixed-position scrim. Used by Modal / Drawer / LoadingOverlay; also public for custom overlay surfaces. */
export const Backdrop = forwardRef<HTMLDivElement, BackdropProps>(function Backdrop(
  { open = true, isBlurred, pointerEvents = 'auto', isInline, className, style, ...rest },
  ref,
) {
  // `data-state` is injected by <Presence>; the fade tokens are gated on it so
  // enter plays on mount and exit plays before Presence defers the unmount.
  const node = (
    <div
      ref={ref}
      style={{ pointerEvents, ...style }}
      className={cn(
        'fixed inset-0 z-overlay bg-black/50',
        'motion-safe:data-[state=open]:animate-(--animate-fade-in)',
        'motion-safe:data-[state=closed]:animate-(--animate-fade-out)',
        isBlurred && 'backdrop-blur-sm',
        className,
      )}
      {...rest}
    />
  );
  const presence = <Presence isPresent={open}>{node}</Presence>;
  return isInline ? presence : <Portal>{presence}</Portal>;
});
