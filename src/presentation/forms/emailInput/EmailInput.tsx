import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../../foundation/utils';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { inputBaseVariants, InputSize, InputState, type InputBaseVariants } from '../InputStyles';

export interface EmailInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    Omit<InputBaseVariants, 'size' | 'state'> {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
}

/** `<input type="email">` with sensible defaults (autocomplete, inputmode). */
export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, size, state, id, disabled, required, readOnly, ...props }, ref) => {
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? InputState.Invalid : InputState.Default);
    return (
      <input
        ref={ref}
        type="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
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
EmailInput.displayName = 'EmailInput';
