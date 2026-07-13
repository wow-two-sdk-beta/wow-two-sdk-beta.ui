import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { Checkbox, type CheckboxProps } from '../checkbox/Checkbox';

export interface CheckboxFieldProps extends Omit<CheckboxProps, 'children'> {
  /** The right-side label. */
  label: ReactNode;

  /** The smaller helper / description below. */
  description?: ReactNode;

  /** The wrap-element className (the `<label>`). */
  wrapperClassName?: string;
}

/**
 * Checkbox + right-side label + optional description, wrapped in a single
 * `<label>` so clicking text toggles the box.
 */
export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, description, id, wrapperClassName, className, ...props }, ref) => {
    const generated = useId();
    // Context id wins over the generated fallback — inside a `Field`/`form.Field`
    // the surrounding Label's `htmlFor` targets `ctx.id`, so the box must carry it.
    const ctx = useFormControl();
    const inputId = id ?? ctx?.id ?? generated;
    return (
      <label
        htmlFor={inputId}
        className={cn('flex items-start gap-2.5 cursor-pointer', wrapperClassName)}
      >
        <Checkbox ref={ref} id={inputId} className={className} {...props} />
        <span className="flex flex-col gap-0.5 text-sm">
          <span className="font-medium text-foreground">{label}</span>
          {description && <span className="text-muted-foreground">{description}</span>}
        </span>
      </label>
    );
  },
);
CheckboxField.displayName = 'CheckboxField';
