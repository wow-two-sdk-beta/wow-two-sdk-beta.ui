import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import { iconButtonVariants, type IconButtonVariants } from './IconButton.variants';

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    IconButtonVariants {
  /** REQUIRED accessible label. IconButton has no visible text. */
  'aria-label': string;
  children: ReactNode;
}

/**
 * Square / circular button containing only an icon. `aria-label` is
 * required by the type — there is no visible text fallback.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, shape, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonVariants({ variant, size, shape }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = 'IconButton';
