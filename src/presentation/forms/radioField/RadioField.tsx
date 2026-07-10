import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { Radio, type RadioProps } from '../radio/Radio';

export interface RadioFieldProps extends Omit<RadioProps, 'children'> {
  label: ReactNode;
  description?: ReactNode;
  wrapperClassName?: string;
}

/**
 * Radio + right-side label + optional description, wrapped in a `<label>`.
 */
export const RadioField = forwardRef<HTMLInputElement, RadioFieldProps>(
  ({ label, description, id, wrapperClassName, className, ...props }, ref) => {
    const generated = useId();
    // Context id wins over the generated fallback (see CheckboxField).
    const ctx = useFormControl();
    const inputId = id ?? ctx?.id ?? generated;
    return (
      <label htmlFor={inputId} className={cn('flex items-start gap-2.5 cursor-pointer', wrapperClassName)}>
        <Radio ref={ref} id={inputId} className={className} {...props} />
        <span className="flex flex-col gap-0.5 text-sm">
          <span className="font-medium text-foreground">{label}</span>
          {description && <span className="text-muted-foreground">{description}</span>}
        </span>
      </label>
    );
  },
);
RadioField.displayName = 'RadioField';
