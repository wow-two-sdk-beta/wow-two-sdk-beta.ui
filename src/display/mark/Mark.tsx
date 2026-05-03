import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export type MarkProps = ComponentPropsWithoutRef<'mark'>;

/**
 * Highlighted text — semantic `<mark>` with a yellow tint. Use for search
 * matches and "you mentioned this" affordances.
 */
export const Mark = forwardRef<HTMLElement, MarkProps>(({ className, ...props }, ref) => (
  <mark
    ref={ref}
    className={cn('rounded-sm bg-warning-soft px-0.5 text-warning-soft-foreground', className)}
    {...props}
  />
));
Mark.displayName = 'Mark';
