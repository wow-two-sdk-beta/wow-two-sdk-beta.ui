import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../InputStyles';

export interface EmailInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    InputBaseVariants {}

/** `<input type="email">` with sensible defaults (autocomplete, inputmode). */
export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, size, state, id, disabled, required, readOnly, ...props }, ref) => {
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? 'invalid' : 'default');
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
