import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn, type OverlayPosition } from '../../../foundation/utils';
import { fabVariants, type FABVariants, type FabVariant, type FabSize } from './FAB.variants';

export interface FABProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<FABVariants, 'variant' | 'size' | 'position'> {
  /** The visual surface style. */
  variant?: FabVariant;
  /** The button diameter. */
  size?: FabSize;
  /** The anchor position on the viewport. */
  position?: OverlayPosition;
  /** The required accessible label — FAB content is typically icon-only. */
  'aria-label': string;
  children: ReactNode;
}

/** Floating Action Button — fixed-position circular button with shadow. */
export const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ className, variant, size, position, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(fabVariants({ variant, size, position }), className)}
      {...props}
    />
  ),
);
FAB.displayName = 'FAB';
