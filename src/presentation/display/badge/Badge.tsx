import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn, type Size } from '../../../foundation/utils';
import { badgeVariants, type BadgeVariant, type BadgeVariants } from './Badge.variants';

export interface BadgeProps
  extends ComponentPropsWithoutRef<'span'>,
    Omit<BadgeVariants, 'variant' | 'size'> {
  /** The color treatment. */
  variant?: BadgeVariant;
  /** The size step. */
  size?: Size;
}

/**
 * Pill-shaped status / category indicator. Non-interactive — for clickable
 * use `Tag`. For severity-tinted callouts at message scale, use `Alert*`.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        badgeVariants({ variant, size: size as BadgeVariants['size'] }),
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';
