import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';

export type FormHelperTextProps = ComponentPropsWithoutRef<'p'>;

/**
 * Helper / hint text below a form control. Reads `helperId` from
 * `FormControl` so the input can reference it via `aria-describedby`.
 */
export const FormHelperText = forwardRef<HTMLParagraphElement, FormHelperTextProps>(
  ({ className, id, ...props }, ref) => {
    const ctx = useFormControl();
    return (
      <p
        ref={ref}
        id={id ?? ctx?.helperId}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  },
);
FormHelperText.displayName = 'FormHelperText';
