import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  severity?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
}

const SEVERITY: Record<NonNullable<CalloutProps['severity']>, string> = {
  info: 'border-l-info text-foreground',
  success: 'border-l-success text-foreground',
  warning: 'border-l-warning text-foreground',
  danger: 'border-l-destructive text-foreground',
  neutral: 'border-l-border text-foreground',
};

/**
 * Quieter cousin of `Alert` — colored left rule, no fill. Use for inline
 * doc-style notes, supplementary content (think MDX callouts).
 */
export const Callout = forwardRef<HTMLDivElement, CalloutProps>(
  ({ severity = 'info', icon, title, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-start gap-3 rounded-md border-l-4 bg-card px-4 py-3 text-sm',
        SEVERITY[severity],
        className,
      )}
      {...props}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <div className="mb-0.5 font-medium">{title}</div>}
        {children}
      </div>
    </div>
  ),
);
Callout.displayName = 'Callout';
