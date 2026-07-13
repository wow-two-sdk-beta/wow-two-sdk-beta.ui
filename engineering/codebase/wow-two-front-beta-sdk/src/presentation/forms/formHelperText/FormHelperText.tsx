import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../../foundation/utils';
import {
  useFormControl,
  useFormControlChrome,
} from '../../../foundation/primitives/formControlContext/FormControlContext';

export type FormHelperTextProps = ComponentPropsWithoutRef<'p'>;

/**
 * Helper / hint text below a form control. Takes `helperId` from `FormControl`
 * and registers itself with the context, so the control's `aria-describedby`
 * references the id only while this node actually renders.
 */
export const FormHelperText = forwardRef<HTMLParagraphElement, FormHelperTextProps>(
  ({ className, id, ...props }, ref) => {
    const ctx = useFormControl();
    // An explicit `id` prop detaches the node from the context's helperId — don't register.
    useFormControlChrome('helper', id == null);
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
