import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../_styles';
import { formatISODate, parseISODate } from '../_dateUtils';

export interface DateFieldProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'size'
    >,
    InputBaseVariants {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
  min?: Date | null;
  max?: Date | null;
}

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  { value, defaultValue, onChange, min, max, size, state, className, id, disabled, required, ...rest },
  ref,
) {
  const ctx = useFormControl();
  const [current, setCurrent] = useControlled<Date | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange,
  });
  return (
    <input
      ref={ref}
      type="date"
      id={id ?? ctx?.id}
      disabled={disabled ?? ctx?.isDisabled}
      required={required ?? ctx?.isRequired}
      aria-invalid={ctx?.isInvalid || undefined}
      aria-describedby={ctx ? `${ctx.helperId} ${ctx.errorId}` : undefined}
      value={formatISODate(current)}
      min={formatISODate(min)}
      max={formatISODate(max)}
      onChange={(e) => setCurrent(parseISODate(e.target.value))}
      className={cn(inputBaseVariants({ size, state: state ?? (ctx?.isInvalid ? 'invalid' : 'default') }), className)}
      {...rest}
    />
  );
});
