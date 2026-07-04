import { forwardRef, type InputHTMLAttributes } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../InputStyles';
import { formatISOTime, parseISOTime } from '../DateExtensions';

export interface TimeFieldProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'type' | 'value' | 'defaultValue' | 'onChange' | 'size'
    >,
    InputBaseVariants {
  value?: Temporal.PlainTime | null;
  defaultValue?: Temporal.PlainTime | null;
  onValueChange?: (value: Temporal.PlainTime | null) => void;
}

export const TimeField = forwardRef<HTMLInputElement, TimeFieldProps>(function TimeField(
  { value, defaultValue, onValueChange, size, state, className, id, disabled, required, ...rest },
  ref,
) {
  const ctx = useFormControl();
  const [current, setCurrent] = useControlled<Temporal.PlainTime | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange: onValueChange,
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
      value={formatISOTime(current)}
      onChange={(e) => setCurrent(parseISOTime(e.target.value))}
      className={cn(inputBaseVariants({ size, state: state ?? (ctx?.isInvalid ? 'invalid' : 'default') }), className)}
      {...rest}
    />
  );
});
