import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import { badgeVariants, type BadgeVariants } from './Badge.variants';

export interface BadgeProps extends ComponentPropsWithoutRef<'span'>, BadgeVariants {}

/**
 * Pill-shaped status / category indicator. Non-interactive — for clickable
 * use `Tag`. For severity-tinted callouts at message scale, use `Alert*`.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />
  ),
);
Badge.displayName = 'Badge';
