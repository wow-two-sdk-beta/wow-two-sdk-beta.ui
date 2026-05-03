import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import { overlayButtonVariants, type OverlayButtonVariants } from './OverlayButton.variants';

export interface OverlayButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    OverlayButtonVariants {
  /** REQUIRED accessible label — overlay buttons are typically icon-only. */
  'aria-label': string;
  children: ReactNode;
}

/**
 * Icon button absolutely positioned over its parent. Use for image-hover
 * affordances (zoom, delete, edit), close buttons on cards, etc.
 *
 * Pair with `appearOn="hover"` and a parent with `className="group"` to
 * reveal only on hover.
 */
export const OverlayButton = forwardRef<HTMLButtonElement, OverlayButtonProps>(
  ({ className, size, position, appearOn, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(overlayButtonVariants({ size, position, appearOn }), className)}
      {...props}
    />
  ),
);
OverlayButton.displayName = 'OverlayButton';
