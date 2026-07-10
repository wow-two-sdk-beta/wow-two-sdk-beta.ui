import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../../foundation/utils';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import {
  inputBaseVariants,
  InputSize,
  InputState,
  InputBorder,
  InputRing,
  type InputBaseVariants,
} from '../InputStyles';

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    Omit<InputBaseVariants, 'size' | 'state' | 'border' | 'ring'> {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  /** The border weight. */
  border?: InputBorder;
  /** The focus-ring weight. */
  ring?: InputRing;
}

/**
 * Single-line text input. For email/tel/url/number/password/search variants
 * use the dedicated input component (each carries only the props/buttons it
 * actually needs).
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, size, state, border, ring, id, disabled, required, readOnly, ...props }, ref) => {
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? InputState.Invalid : InputState.Default);
    return (
      <input
        ref={ref}
        type="text"
        id={id ?? ctx?.id}
        disabled={disabled ?? ctx?.isDisabled}
        required={required ?? ctx?.isRequired}
        readOnly={readOnly ?? ctx?.isReadOnly}
        aria-invalid={ctx?.isInvalid || undefined}
        aria-describedby={ctx?.describedBy}
        className={cn(inputBaseVariants({ size, state: finalState, border, ring }), className)}
        {...props}
      />
    );
  },
);
TextInput.displayName = 'TextInput';
