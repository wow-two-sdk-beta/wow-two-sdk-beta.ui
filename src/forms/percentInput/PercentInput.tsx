import { forwardRef } from 'react';
import { cn } from '../../utils';
import { NumberInput, type NumberInputProps } from '../numberInput/NumberInput';

export type PercentInputProps = Omit<NumberInputProps, 'children'>;

/**
 * `NumberInput` with a trailing `%` decoration. Input value remains the
 * bare number (interpret as 0–100 in your form).
 */
export const PercentInput = forwardRef<HTMLInputElement, PercentInputProps>(
  ({ className, ...props }, ref) => (
    <div className={cn('relative', className)}>
      <NumberInput ref={ref} {...props} className="pr-16" />
      <span className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        %
      </span>
    </div>
  ),
);
PercentInput.displayName = 'PercentInput';
