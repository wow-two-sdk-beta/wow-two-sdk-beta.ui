import { forwardRef, type FieldsetHTMLAttributes } from 'react';
import { cn } from '../../utils';

export type FieldsetProps = FieldsetHTMLAttributes<HTMLFieldSetElement>;

/**
 * Semantic `<fieldset>` for grouping related controls. Pair with `Legend`
 * for the group label.
 */
export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(
  ({ className, ...props }, ref) => (
    <fieldset
      ref={ref}
      className={cn('m-0 min-w-0 border-0 p-0', className)}
      {...props}
    />
  ),
);
Fieldset.displayName = 'Fieldset';
