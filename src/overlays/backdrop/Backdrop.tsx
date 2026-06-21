import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { Portal } from '../../primitives';

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
  if (!open) return null;
  const node = (
    <div
      ref={ref}
      data-state={open ? 'open' : 'closed'}
      style={{ pointerEvents, ...style }}
      className={cn(
        'fixed inset-0 z-overlay bg-black/50 animate-in fade-in-0',
        isBlurred && 'backdrop-blur-sm',
        className,
      )}
      {...rest}
    />
  );
  return isInline ? node : <Portal>{node}</Portal>;
});
