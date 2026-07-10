import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../../foundation/utils';
import {
  FormControlProvider,
  useFormControl,
} from '../../../foundation/primitives/formControlContext/FormControlContext';
import { Label } from '../label/Label';
import { FormHelperText } from '../formHelperText/FormHelperText';
import { FormErrorMessage } from '../formErrorMessage/FormErrorMessage';

export interface FieldProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The label text. Pass a node for richer content (e.g. label + tooltip). */
  label?: ReactNode;

  /** The helper / hint shown beneath the control. Hidden while errors show. */
  helper?: ReactNode;

  /**
   * The error text — renders only when truthy. Sets `isInvalid` on the form context.
   * Inside a forms-engine `form.Field` this is an OVERRIDE: leave it unset and the
   * field's own errors (client + server, all of them) render automatically.
   */
  error?: ReactNode;

  /** The required state (also exposes `isRequired` to the control via context). */
  isRequired?: boolean;

  /** The disabled state (also exposes `isDisabled` to the control). */
  isDisabled?: boolean;

  /** The read-only state (also exposes `isReadOnly` to the control). */
  isReadOnly?: boolean;

  /** The single form control (Input, Select, etc.) — receives wired id/aria via context. */
  children: ReactNode;
}

/**
 * One-stop label + control + helper + error wrapper. Wraps children in a
 * `FormControlProvider` so the inner control auto-wires `id`, `aria-describedby`,
 * `aria-invalid`, `disabled`, `required`, `readOnly`.
 *
 * Form-aware: composed inside a forms-engine `form.Field` render prop it ADOPTS the
 * glue's context instead of shadowing it — same ids, inherited `isInvalid`/flags, and
 * the field's errors render without hand-wiring (`error` prop stays as an override).
 * Standalone (no surrounding provider) it behaves exactly as before.
 */
export const Field = forwardRef<HTMLDivElement, FieldProps>(
  (
    { label, helper, error, isRequired, isDisabled, isReadOnly, children, className, ...props },
    ref,
  ) => {
    const parent = useFormControl();
    const hasOwnError = Boolean(error);
    // Mirror FormErrorMessage's visibility so the helper never hides behind an error that won't render.
    const showError = hasOwnError || ((parent?.errors?.length ?? 0) > 0 && (parent?.isInvalid ?? false));
    return (
      <FormControlProvider
        id={parent?.id}
        errors={parent?.errors}
        isInvalid={hasOwnError || (parent?.isInvalid ?? false)}
        isRequired={isRequired ?? parent?.isRequired}
        isDisabled={isDisabled ?? parent?.isDisabled}
        isReadOnly={isReadOnly ?? parent?.isReadOnly}
      >
        <div
          ref={ref}
          className={cn('flex flex-col gap-1.5', className)}
          {...props}
        >
          {label && <Label>{label}</Label>}
          {children}
          {showError ? (
            <FormErrorMessage>{hasOwnError ? error : undefined}</FormErrorMessage>
          ) : (
            helper && <FormHelperText>{helper}</FormHelperText>
          )}
        </div>
      </FormControlProvider>
    );
  },
);
Field.displayName = 'Field';
