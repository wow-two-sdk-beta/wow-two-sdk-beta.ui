import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';

export interface StatusProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  tone?: 'success' | 'warning' | 'destructive' | 'info' | 'neutral';
  /** Optional pulsing ring around the dot. */
  pulse?: boolean;
  /** Visual size — drives dot dimensions, text size, and gap. Default `md`. */
  size?: 'xs' | 'sm' | 'md';
  children?: ReactNode;
}

const TONE: Record<NonNullable<StatusProps['tone']>, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-muted-foreground',
};

const SIZE: Record<NonNullable<StatusProps['size']>, { wrapper: string; dot: string }> = {
  xs: { wrapper: 'gap-1.5 text-xs', dot: 'h-1.5 w-1.5' },
  sm: { wrapper: 'gap-1.5 text-sm', dot: 'h-2 w-2' },
  md: { wrapper: 'gap-2 text-sm', dot: 'h-2 w-2' },
};

/**
 * Colored dot + text label — server status, online presence, build state.
 * Use `Status` (with text) for labelled indicators; `NotificationDot` for
 * the bare positioned dot.
 */
export const Status = forwardRef<HTMLSpanElement, StatusProps>(
  ({ tone = 'success', pulse, size = 'md', className, children, ...props }, ref) => {
    const sz = SIZE[size];
    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center text-foreground', sz.wrapper, className)}
        {...props}
      >
        <span className="relative inline-flex">
          <span className={cn('inline-block rounded-full', sz.dot, TONE[tone])} />
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
    );
  },
);
Status.displayName = 'Status';
