import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';

export interface StatusProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  tone?: 'success' | 'warning' | 'destructive' | 'info' | 'neutral';
  /** Optional pulsing ring around the dot. */
  pulse?: boolean;
  children?: ReactNode;
}

const TONE: Record<NonNullable<StatusProps['tone']>, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-muted-foreground',
};

/**
 * Colored dot + text label — server status, online presence, build state.
 * Use `Status` (with text) for labelled indicators; `NotificationDot` for
 * the bare positioned dot.
 */
export const Status = forwardRef<HTMLSpanElement, StatusProps>(
  ({ tone = 'success', pulse, className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('inline-flex items-center gap-2 text-sm text-foreground', className)}
      {...props}
    >
      <span className="relative inline-flex">
        <span className={cn('inline-block h-2 w-2 rounded-full', TONE[tone])} />
        {pulse && (
          <span
            className={cn(
              'absolute inset-0 inline-block rounded-full opacity-75 animate-ping',
              TONE[tone],
            )}
          />
        )}
      </span>
      {children}
    </span>
  ),
);
Status.displayName = 'Status';
