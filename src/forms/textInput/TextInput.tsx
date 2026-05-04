import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../InputStyles';

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    InputBaseVariants {}

/**
 * Single-line text input. For email/tel/url/number/password/search variants
 * use the dedicated input component (each carries only the props/buttons it
 * actually needs).
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, size, state, id, disabled, required, readOnly, ...props }, ref) => {
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? 'invalid' : 'default');
    return (
      <input
        ref={ref}
        type="text"
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
TextInput.displayName = 'TextInput';
