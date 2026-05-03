import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Spinner, type SpinnerProps } from '../spinner/Spinner';

export interface InlineSpinnerProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Label rendered next to the spinner. Default `"Loading…"`. */
  children?: ReactNode;
  size?: SpinnerProps['size'];
  tone?: SpinnerProps['tone'];
}

/**
 * Spinner + label inline. Drops cleanly into buttons, list rows, anywhere
 * a "loading…" affordance is needed mid-flow.
 */
export const InlineSpinner = forwardRef<HTMLSpanElement, InlineSpinnerProps>(
  ({ children = 'Loading…', size = 'sm', tone = 'default', className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('inline-flex items-center gap-2 text-sm text-muted-foreground', className)}
      {...props}
    >
      <Spinner size={size} tone={tone} />
      {children}
    </span>
  ),
);
InlineSpinner.displayName = 'InlineSpinner';
