import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Temporal } from 'temporal-polyfill';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { selectTriggerVariants, SelectSize, type SelectTriggerVariants } from '../select/Select.variants';
import { InputState } from '../InputStyles';
import { formatISODate, today } from '../DateExtensions';
import { Calendar } from '../calendar';

export interface DatePickerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'defaultValue'>,
    Omit<SelectTriggerVariants, 'size' | 'state'> {
  value?: Temporal.PlainDate | null;
  defaultValue?: Temporal.PlainDate | null;
  onValueChange?: (date: Temporal.PlainDate | null) => void;
  placeholder?: string;
  format?: (date: Temporal.PlainDate) => string;
  min?: Temporal.PlainDate | null;
  max?: Temporal.PlainDate | null;
  isDisabled?: (date: Temporal.PlainDate) => boolean;
  isInvalid?: boolean;
  /** The hidden input name; when set, a hidden input ships the ISO value with form submission. */
  name?: string;
  /** The trigger size. */
  size?: SelectSize;
  /** The validity surface. */
  state?: InputState;
}

const defaultFormat = (d: Temporal.PlainDate) =>
  d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(
  {
    value,
    defaultValue,
    onValueChange,
    placeholder = 'Pick a date',
    format = defaultFormat,
    min,
    max,
    isDisabled: dayDisabled,
    isInvalid,
    name,
    size,
    state,
    className,
    disabled,
    ...rest
  },
  forwardedRef,
) {
  const [date, setDate] = useControlled<Temporal.PlainDate | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange: onValueChange,
  });
  const [open, setOpen] = useControlled<boolean>({
    controlled: undefined,
    default: false,
  });

  const triggerState = state ?? (isInvalid ? InputState.Invalid : InputState.Default);

  return (
    <Popover open={open} onOpenChange={setOpen} placement="bottom-start" offset={6}>
      <PopoverTrigger asChild>
        <button
          ref={forwardedRef}
          type="button"
          disabled={disabled}
          className={cn(selectTriggerVariants({ size, state: triggerState }), className)}
          {...rest}
        >
          {/* `muted-foreground` (not `subtle-foreground`): the trigger surface is muted, where subtle is only 4.2:1 (see index.css). */}
          <span className={cn('truncate', !date && 'text-muted-foreground')}>
            {date ? format(date) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent isBare>
        <Calendar
          value={date}
          onValueChange={(d) => {
            setDate(d);
            setOpen(false);
          }}
          defaultMonth={date ?? today()}
          min={min}
          max={max}
          isDisabled={dayDisabled}
        />
      </PopoverContent>
      {name && <input type="hidden" name={name} value={formatISODate(date)} />}
    </Popover>
  );
});
