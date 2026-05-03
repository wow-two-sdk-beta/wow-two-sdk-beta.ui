import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';

export interface BadgeOverlayProps extends ComponentPropsWithoutRef<'div'> {
  /** Element to overlay on (avatar, button, image). */
  children: ReactNode;
  /** Badge content (count, dot, icon). */
  badge: ReactNode;
  /** Position of the badge relative to the wrapper. Default `top-right`. */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Hide badge when truthy (e.g. when count is 0). */
  hidden?: boolean;
}

const POS: Record<NonNullable<BadgeOverlayProps['position']>, string> = {
  'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
  'top-left': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
  'bottom-left': 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2',
};

/**
 * Decorator that overlays a badge / dot on top of any child. Use to
 * attach `CountBadge`, `NotificationDot`, or arbitrary `Badge` to an
 * `Avatar`, `IconButton`, or icon.
 */
export const BadgeOverlay = forwardRef<HTMLDivElement, BadgeOverlayProps>(
  ({ children, badge, position = 'top-right', hidden, className, ...props }, ref) => (
    <div ref={ref} className={cn('relative inline-flex', className)} {...props}>
      {children}
      {!hidden && (
        <span className={cn('absolute z-10', POS[position])}>{badge}</span>
      )}
    </div>
  ),
);
BadgeOverlay.displayName = 'BadgeOverlay';
