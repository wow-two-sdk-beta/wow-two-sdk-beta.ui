import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { Portal } from '../../primitives';

export interface BackdropProps extends HTMLAttributes<HTMLDivElement> {
  /** Mount state. Default `true`. */
  open?: boolean;
  /** Apply backdrop-blur. */
  blur?: boolean;
  /** When `'none'`, clicks pass through. Default `'auto'`. */
  pointerEvents?: 'auto' | 'none';
  /** Skip the Portal wrap — render in place. */
  inline?: boolean;
}

/**
 * Fixed-position scrim. Used by Dialog / Drawer / LoadingOverlay; also a
 * public component for custom overlay surfaces.
 */
export const Backdrop = forwardRef<HTMLDivElement, BackdropProps>(function Backdrop(
  { open = true, blur, pointerEvents = 'auto', inline, className, style, ...rest },
  ref,
) {
  if (!open) return null;
  const node = (
    <div
      ref={ref}
      data-state={open ? 'open' : 'closed'}
      style={{ pointerEvents, ...style }}
      className={cn(
        'fixed inset-0 z-50 bg-black/50 animate-in fade-in-0',
        blur && 'backdrop-blur-sm',
        className,
      )}
      {...rest}
    />
  );
  return inline ? node : <Portal>{node}</Portal>;
});
