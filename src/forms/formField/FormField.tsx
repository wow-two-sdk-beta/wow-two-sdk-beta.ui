import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { FormControlProvider } from '../../primitives/formControlContext/FormControlContext';
import { Label } from '../label/Label';
import { FormHelperText } from '../formHelperText/FormHelperText';
import { FormErrorMessage } from '../formErrorMessage/FormErrorMessage';

export interface FormFieldProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Label text. Pass a node for richer content (e.g. label + tooltip). */
  label?: ReactNode;
  /** Helper / hint shown beneath the control. Hidden when `error` is set. */
  helper?: ReactNode;
  /** Error text — renders only when truthy. Sets `isInvalid` on the form context. */
  error?: ReactNode;
  /** Mark required (also exposes `isRequired` to the control via context). */
  isRequired?: boolean;
  /** Mark disabled (also exposes `isDisabled` to the control). */
  isDisabled?: boolean;
  /** Mark read-only (also exposes `isReadOnly` to the control). */
  isReadOnly?: boolean;
  /** The single form control (Input, Select, etc.) — receives wired id/aria via context. */
  children: ReactNode;
}

/**
 * One-stop label + control + helper + error wrapper. Wraps children in a
 * `FormControlProvider` so the inner control auto-wires `id`, `aria-describedby`,
 * `aria-invalid`, `disabled`, `required`, `readOnly`.
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    { label, helper, error, isRequired, isDisabled, isReadOnly, children, className, ...props },
    ref,
  ) => (
    <FormControlProvider
      isInvalid={Boolean(error)}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
    >
      <div
        ref={ref}
        className={cn('flex flex-col gap-1.5', className)}
        {...props}
      >
        {label && <Label>{label}</Label>}
        {children}
        {error ? <FormErrorMessage>{error}</FormErrorMessage> : helper && <FormHelperText>{helper}</FormHelperText>}
      </div>
    </FormControlProvider>
  ),
);
FormField.displayName = 'FormField';
