import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';

export type FormErrorMessageProps = ComponentPropsWithoutRef<'p'>;

/**
 * Error copy under a form control. Renders only when the surrounding
 * `FormControl` is `isInvalid`. `id={errorId}` for `aria-describedby` wiring.
 */
export const FormErrorMessage = forwardRef<HTMLParagraphElement, FormErrorMessageProps>(
  ({ className, id, ...props }, ref) => {
    const ctx = useFormControl();
    if (ctx && !ctx.isInvalid) return null;
    return (
      <p
        ref={ref}
        id={id ?? ctx?.errorId}
        role="alert"
        className={cn('text-sm text-destructive', className)}
        {...props}
      />
    );
  },
);
FormErrorMessage.displayName = 'FormErrorMessage';
