import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn, StatusTone } from '../../../foundation/utils';

export interface StatusIndicatorProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** The semantic status tone. */
  tone?: StatusTone;

  /** The bold first-line label (e.g. "All systems normal"). */
  label: ReactNode;

  /** The smaller secondary line (e.g. "Updated 2m ago"). */
  description?: ReactNode;

  /** The optional pulsing ring for "live" indication. */
  hasPulse?: boolean;
}

const TONE: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-muted-foreground',
};

/**
 * Two-line status indicator — colored dot + bold label + smaller helper.
 * Use on monitoring / status pages. For an inline single-line indicator use
 * `display/Status`.
 */
export const StatusIndicator = forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ tone = StatusTone.Success, label, description, hasPulse, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-start gap-3', className)}
      {...props}
    >
      <span className="relative mt-1 inline-flex">
        <span className={cn('inline-block h-2.5 w-2.5 rounded-full', TONE[tone])} />
        {hasPulse && (
          <span
            className={cn(
              'absolute inset-0 inline-block rounded-full opacity-75 animate-ping',
              TONE[tone],
            )}
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
    </div>
  ),
);
StatusIndicator.displayName = 'StatusIndicator';
