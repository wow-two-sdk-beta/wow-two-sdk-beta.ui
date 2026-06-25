import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { Portal, Presence } from '../../primitives';

export interface BackdropProps extends HTMLAttributes<HTMLDivElement> {
  /** Mount state. Default `true`. */
  open?: boolean;
  /** Apply backdrop-blur. */
  isBlurred?: boolean;
  /** When `'none'`, clicks pass through. Default `'auto'`. */
  pointerEvents?: 'auto' | 'none';
  /** Skip the Portal wrap — render in place. */
  isInline?: boolean;
}

/** Fixed-position scrim. Used by Dialog / Drawer / LoadingOverlay; also public for custom overlay surfaces. */
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
