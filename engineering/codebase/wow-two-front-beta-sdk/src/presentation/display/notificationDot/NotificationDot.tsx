import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn, CornerPosition } from '../../../foundation/utils';

/** Defines the NotificationDot color tone. */
export const NotificationDotTone = {
  /** Refers to the destructive / error color. */
  Destructive: 'destructive',
  /** Refers to the positive / confirmation color. */
  Success: 'success',
  /** Refers to the caution color. */
  Warning: 'warning',
  /** Refers to the informational color. */
  Info: 'info',
  /** Refers to the primary brand color. */
  Primary: 'primary',
  /** Refers to the neutral color. */
  Neutral: 'neutral',
} as const;

export type NotificationDotTone =
  (typeof NotificationDotTone)[keyof typeof NotificationDotTone];

/** Defines the NotificationDot size step. */
export const NotificationDotSize = {
  /** Refers to the extra-small dot. */
  Xs: 'xs',
  /** Refers to the small dot. */
  Sm: 'sm',
  /** Refers to the medium dot. */
  Md: 'md',
} as const;

export type NotificationDotSize =
  (typeof NotificationDotSize)[keyof typeof NotificationDotSize];

export interface NotificationDotProps extends ComponentPropsWithoutRef<'span'> {
  tone?: NotificationDotTone;
  size?: NotificationDotSize;
  /** The pulsing ring around the dot. */
  hasPulse?: boolean;

  /** The corner position — when set, the dot is positioned absolutely relative to its parent. */
  position?: CornerPosition;
}

const TONE: Record<NonNullable<NotificationDotProps['tone']>, string> = {
  destructive: 'bg-destructive',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  primary: 'bg-primary',
  neutral: 'bg-muted-foreground',
};

/* Static literal map — Tailwind must see the complete `after:bg-*` class names. */
const PULSE_TONE: Record<NonNullable<NotificationDotProps['tone']>, string> = {
  destructive: 'after:bg-destructive',
  success: 'after:bg-success',
  warning: 'after:bg-warning',
  info: 'after:bg-info',
  primary: 'after:bg-primary',
  neutral: 'after:bg-muted-foreground',
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
 * absolutely-place over a parent (e.g. on an Avatar or `<Button shape="square"/circle">`).
 */
export const NotificationDot = forwardRef<HTMLSpanElement, NotificationDotProps>(
  ({ tone = 'destructive', size = 'sm', hasPulse, position, className, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        'inline-flex rounded-full ring-2 ring-background',
        TONE[tone],
        SIZE[size],
        /* `relative` anchors the ::after ring; POS comes later so its `absolute` wins when positioned. */
        hasPulse &&
          `relative after:absolute after:inset-0 after:animate-ping after:rounded-full after:opacity-75 after:content-[""] ${PULSE_TONE[tone]}`,
        position && POS[position],
        className,
      )}
      {...props}
    />
  ),
);
NotificationDot.displayName = 'NotificationDot';
