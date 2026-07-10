import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../../foundation/utils';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { inputBaseVariants, InputSize, InputState, type InputBaseVariants } from '../InputStyles';

export interface TextareaInputProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Omit<InputBaseVariants, 'size' | 'state'> {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
}

/**
 * Multi-line text input. Inherits the input visual base. For autosize, pair
 * with a sibling-domain hook in v1 — kept simple at L3.
 */
export const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  (
    { className, size, state, id, disabled, required, readOnly, rows = 3, ...props },
    ref,
  ) => {
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? InputState.Invalid : InputState.Default);
    return (
      <textarea
        ref={ref}
        rows={rows}
        id={id ?? ctx?.id}
        disabled={disabled ?? ctx?.isDisabled}
        required={required ?? ctx?.isRequired}
        readOnly={readOnly ?? ctx?.isReadOnly}
        aria-invalid={ctx?.isInvalid || undefined}
        aria-describedby={ctx?.describedBy}
        className={cn(
          inputBaseVariants({ size, state: finalState }),
          'h-auto resize-y py-2',
          className,
        )}
        {...props}
      />
    );
  },
);
TextareaInput.displayName = 'TextareaInput';
