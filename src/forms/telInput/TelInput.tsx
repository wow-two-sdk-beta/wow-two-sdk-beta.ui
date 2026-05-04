import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../InputStyles';

export interface TelInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    InputBaseVariants {}

/** `<input type="tel">` with `inputmode="tel"` and `autocomplete="tel"`. */
export const TelInput = forwardRef<HTMLInputElement, TelInputProps>(
  ({ className, size, state, id, disabled, required, readOnly, ...props }, ref) => {
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? 'invalid' : 'default');
    return (
      <input
        ref={ref}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        id={id ?? ctx?.id}
        disabled={disabled ?? ctx?.isDisabled}
        required={required ?? ctx?.isRequired}
        readOnly={readOnly ?? ctx?.isReadOnly}
        aria-invalid={ctx?.isInvalid || undefined}
        aria-describedby={ctx ? `${ctx.helperId} ${ctx.errorId}` : undefined}
        className={cn(inputBaseVariants({ size, state: finalState }), className)}
        {...props}
      />
    );
  },
);
TelInput.displayName = 'TelInput';
