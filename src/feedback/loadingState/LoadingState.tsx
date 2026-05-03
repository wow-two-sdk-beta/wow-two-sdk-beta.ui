import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Spinner } from '../spinner/Spinner';

export interface LoadingStateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Heading copy. Default `"Loading…"`. */
  title?: ReactNode;
  /** Body text below the title. */
  description?: ReactNode;
  /** Size of the spinner. Default `lg`. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Centered loading affordance for full sections / pages — Spinner + title +
 * description stacked. Use inline `InlineSpinner` for in-row loading.
 */
export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ title = 'Loading…', description, size = 'lg', className, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}
      {...props}
    >
      <Spinner size={size} tone="brand" />
      {title && <div className="text-sm font-medium text-foreground">{title}</div>}
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
    </div>
  ),
);
LoadingState.displayName = 'LoadingState';
