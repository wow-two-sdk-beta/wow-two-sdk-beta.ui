import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn, type Severity } from '../../../foundation/utils';
import { bannerSimpleVariants, type BannerSimpleVariants } from './BannerSimple.variants';

export interface BannerSimpleProps
  extends ComponentPropsWithoutRef<'div'>,
    Omit<BannerSimpleVariants, 'severity'> {
  /** The semantic severity palette. */
  severity?: Severity;
}

/**
 * Full-width banner — typically pinned to the top of the app to broadcast
 * status. Atom; for structured slotted layout use `Banner` (L4).
 */
export const BannerSimple = forwardRef<HTMLDivElement, BannerSimpleProps>(
  ({ className, severity, role = 'status', ...props }, ref) => (
    <div
      ref={ref}
      role={role}
      className={cn(bannerSimpleVariants({ severity }), className)}
      {...props}
    />
  ),
);
BannerSimple.displayName = 'BannerSimple';
