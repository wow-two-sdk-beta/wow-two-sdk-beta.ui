import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import { fabVariants, type FABVariants } from './FAB.variants';

export interface FABProps extends ButtonHTMLAttributes<HTMLButtonElement>, FABVariants {
  /** Required accessible label — FAB content is typically icon-only. */
  'aria-label': string;
  children: ReactNode;
}

/**
 * Floating Action Button — fixed-position circular button with shadow.
 * Pass an icon (or icon + short label) as children. `aria-label` required.
 */
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
