import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { useId } from '../../hooks';
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
    const inputId = id ?? generated;
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
