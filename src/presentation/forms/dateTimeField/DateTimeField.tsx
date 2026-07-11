import { forwardRef, type InputHTMLAttributes } from 'react';
import { Temporal } from 'temporal-polyfill';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { inputBaseVariants, InputSize, InputState, type InputBaseVariants } from '../InputStyles';
import { formatISODateTime, parseISODateTime } from '../DateExtensions';

export interface DateTimeFieldProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'size'
    >,
    Omit<InputBaseVariants, 'size' | 'state'> {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  value?: Temporal.PlainDateTime | null;
  defaultValue?: Temporal.PlainDateTime | null;
  onValueChange?: (value: Temporal.PlainDateTime | null) => void;
  min?: Temporal.PlainDateTime | null;
  max?: Temporal.PlainDateTime | null;
}

/**
 * Atomic datetime input — the combined-single-input peer of `DateField`/`TimeField`, wrapping
 * `<input type="datetime-local">` with our styling. Accepts and emits `Temporal.PlainDateTime`
 * (calendar wall-clock, no zone), doing `PlainDateTime ↔ ISO string` conversion under the hood.
 * Use directly in forms; for a unified cross-browser popover, compose `DatePicker` + `TimePicker`.
 */
export const DateTimeField = forwardRef<HTMLInputElement, DateTimeFieldProps>(function DateTimeField(
  { value, defaultValue, onValueChange, min, max, size, state, className, id, disabled, required, ...rest },
  ref,
) {
  const ctx = useFormControl();
  const [current, setCurrent] = useControlled<Temporal.PlainDateTime | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange: onValueChange,
  });
  return (
    <input
      ref={ref}
      type="datetime-local"
      id={id ?? ctx?.id}
      disabled={disabled ?? ctx?.isDisabled}
      required={required ?? ctx?.isRequired}
      aria-invalid={ctx?.isInvalid || undefined}
      aria-describedby={ctx?.describedBy}
      value={formatISODateTime(current)}
      min={formatISODateTime(min)}
      max={formatISODateTime(max)}
      onChange={(e) => setCurrent(parseISODateTime(e.target.value))}
      className={cn(
        inputBaseVariants({ size, state: state ?? (ctx?.isInvalid ? InputState.Invalid : InputState.Default) }),
        className,
      )}
      {...rest}
    />
  );
});
