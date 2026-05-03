import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { useId } from '../../hooks';
import { Checkbox, type CheckboxProps } from '../checkbox/Checkbox';

export interface CheckboxFieldProps extends Omit<CheckboxProps, 'children'> {
  /** Right-side label. */
  label: ReactNode;
  /** Smaller helper / description below. */
  description?: ReactNode;
  /** Wrap-element className (the `<label>`). */
  wrapperClassName?: string;
}

/**
 * Checkbox + right-side label + optional description, wrapped in a single
 * `<label>` so clicking text toggles the box.
 */
export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, description, id, wrapperClassName, className, ...props }, ref) => {
    const generated = useId();
    const inputId = id ?? generated;
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
