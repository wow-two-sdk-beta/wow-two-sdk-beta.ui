import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../_styles';
import { formatISOTime, parseISOTime } from '../_dateUtils';

export interface TimeValue {
  hours: number;
  minutes: number;
}

export interface TimeFieldProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'type' | 'value' | 'defaultValue' | 'onChange' | 'size'
    >,
    InputBaseVariants {
  value?: TimeValue | null;
  defaultValue?: TimeValue | null;
  onChange?: (value: TimeValue | null) => void;
}

function timeToString(t: TimeValue | null | undefined): string {
  if (!t) return '';
  const date = new Date();
  date.setHours(t.hours, t.minutes, 0, 0);
  return formatISOTime(date);
}

export const TimeField = forwardRef<HTMLInputElement, TimeFieldProps>(function TimeField(
  { value, defaultValue, onChange, size, state, className, id, disabled, required, ...rest },
  ref,
) {
  const ctx = useFormControl();
  const [current, setCurrent] = useControlled<TimeValue | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange,
  });
  return (
    <input
      ref={ref}
      type="time"
      id={id ?? ctx?.id}
      disabled={disabled ?? ctx?.isDisabled}
      required={required ?? ctx?.isRequired}
      aria-invalid={ctx?.isInvalid || undefined}
      aria-describedby={ctx ? `${ctx.helperId} ${ctx.errorId}` : undefined}
      value={timeToString(current)}
      onChange={(e) => setCurrent(parseISOTime(e.target.value))}
      className={cn(inputBaseVariants({ size, state: state ?? (ctx?.isInvalid ? 'invalid' : 'default') }), className)}
      {...rest}
    />
  );
});
