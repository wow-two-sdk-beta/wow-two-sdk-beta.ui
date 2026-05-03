import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface NotificationDotProps extends ComponentPropsWithoutRef<'span'> {
  tone?: 'destructive' | 'success' | 'warning' | 'info' | 'primary' | 'neutral';
  size?: 'xs' | 'sm' | 'md';
  /** Adds a pulsing ring around the dot. */
  pulse?: boolean;
  /** When set, the dot is positioned absolutely relative to its parent. */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const TONE: Record<NonNullable<NotificationDotProps['tone']>, string> = {
  destructive: 'bg-destructive',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  primary: 'bg-primary',
  neutral: 'bg-muted-foreground',
};

const SIZE: Record<NonNullable<NotificationDotProps['size']>, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
};

const POS: Record<NonNullable<NotificationDotProps['position']>, string> = {
  'top-right': 'absolute -top-0.5 -right-0.5',
  'top-left': 'absolute -top-0.5 -left-0.5',
  'bottom-right': 'absolute -bottom-0.5 -right-0.5',
  'bottom-left': 'absolute -bottom-0.5 -left-0.5',
};

/**
 * Tiny colored dot — unread/notification indicator. Pass `position` to
 * absolutely-place over a parent (e.g. on an Avatar or IconButton).
 */
export const NotificationDot = forwardRef<HTMLSpanElement, NotificationDotProps>(
  ({ tone = 'destructive', size = 'sm', pulse, position, className, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        'inline-flex rounded-full ring-2 ring-background',
        TONE[tone],
        SIZE[size],
        position && POS[position],
        pulse && 'after:absolute after:inset-0 after:animate-ping after:rounded-full after:opacity-75 after:content-[""] ' + TONE[tone],
        className,
      )}
      {...props}
    />
  ),
);
NotificationDot.displayName = 'NotificationDot';
