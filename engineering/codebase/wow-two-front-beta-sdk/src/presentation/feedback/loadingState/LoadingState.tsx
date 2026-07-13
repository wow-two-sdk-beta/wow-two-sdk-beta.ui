import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn, Size } from '../../../foundation/utils';
import { Spinner } from '../spinner/Spinner';

export interface LoadingStateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** The heading copy. Default `"Loading…"`. */
  title?: ReactNode;

  /** The body text below the title. */
  description?: ReactNode;

  /** The size of the spinner. Default `lg`. */
  size?: Size;
}

/**
 * Centered loading affordance for full sections / pages — Spinner + title +
 * description stacked. Use inline `InlineSpinner` for in-row loading.
 */
export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ title = 'Loading…', description, size = Size.Lg, className, ...props }, ref) => (
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
