import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils';

export type LegendProps = HTMLAttributes<HTMLLegendElement>;

/**
 * `<legend>` styled to match `Label`. Pair with `Fieldset`.
 */
export const Legend = forwardRef<HTMLLegendElement, LegendProps>(
  ({ className, ...props }, ref) => (
    <legend
      ref={ref}
      className={cn('mb-2 text-sm font-medium text-neutral-900', className)}
      {...props}
    />
  ),
);
Legend.displayName = 'Legend';
