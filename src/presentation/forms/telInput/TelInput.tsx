import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../../foundation/utils';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { inputBaseVariants, InputSize, InputState, type InputBaseVariants } from '../InputStyles';

export interface TelInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    Omit<InputBaseVariants, 'size' | 'state'> {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
}

/** `<input type="tel">` with `inputmode="tel"` and `autocomplete="tel"`. */
export const TelInput = forwardRef<HTMLInputElement, TelInputProps>(
  ({ className, size, state, id, disabled, required, readOnly, ...props }, ref) => {
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? InputState.Invalid : InputState.Default);
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
