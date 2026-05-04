import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../InputStyles';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    InputBaseVariants {}

/**
 * Multi-line text input. Inherits the input visual base. For autosize, pair
 * with a sibling-domain hook in v1 — kept simple at L3.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, size, state, id, disabled, required, readOnly, rows = 3, ...props },
    ref,
  ) => {
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? 'invalid' : 'default');
    return (
      <textarea
        ref={ref}
        rows={rows}
        id={id ?? ctx?.id}
        disabled={disabled ?? ctx?.isDisabled}
        required={required ?? ctx?.isRequired}
        readOnly={readOnly ?? ctx?.isReadOnly}
        aria-invalid={ctx?.isInvalid || undefined}
        aria-describedby={ctx ? `${ctx.helperId} ${ctx.errorId}` : undefined}
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
Textarea.displayName = 'Textarea';
