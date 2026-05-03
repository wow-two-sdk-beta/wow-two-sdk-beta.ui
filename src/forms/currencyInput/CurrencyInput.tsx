import { forwardRef } from 'react';
import { cn } from '../../utils';
import { NumberInput, type NumberInputProps } from '../numberInput/NumberInput';

export interface CurrencyInputProps extends Omit<NumberInputProps, 'children'> {
  /** Currency symbol or 3-letter code displayed as a prefix. Default `"$"`. */
  symbol?: string;
}

/**
 * `NumberInput` with a leading currency symbol. Symbol shown as a non-input
 * decoration (input value is the bare number).
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ symbol = '$', className, ...props }, ref) => (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        {symbol}
      </span>
      <NumberInput ref={ref} {...props} className="pl-7" />
    </div>
  ),
);
CurrencyInput.displayName = 'CurrencyInput';
