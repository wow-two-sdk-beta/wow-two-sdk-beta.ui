import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { selectTriggerVariants, type SelectTriggerVariants } from '../select/Select.variants';
import { formatISODate } from '../DateExtensions';
import { Calendar } from '../calendar';

export interface DatePickerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'defaultValue'>,
    SelectTriggerVariants {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  format?: (date: Date) => string;
  min?: Date | null;
  max?: Date | null;
  isDisabled?: (date: Date) => boolean;
  invalid?: boolean;
  /** When `name` is set, a hidden input ships the ISO value with form submission. */
  name?: string;
}

const defaultFormat = (d: Date) =>
  d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(
  {
    value,
    defaultValue,
    onChange,
    placeholder = 'Pick a date',
    format = defaultFormat,
    min,
    max,
    isDisabled: dayDisabled,
    invalid,
    name,
    size,
    state,
    className,
    disabled,
    ...rest
  },
  forwardedRef,
) {
  const [date, setDate] = useControlled<Date | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange,
  });
  const [open, setOpen] = useControlled<boolean>({
    controlled: undefined,
    default: false,
  });

  const triggerState = state ?? (invalid ? 'invalid' : 'default');

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
          <span className={cn('truncate', !date && 'text-subtle-foreground')}>
            {date ? format(date) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent bare>
        <Calendar
          value={date}
          onChange={(d) => {
            setDate(d);
            setOpen(false);
          }}
          defaultMonth={date ?? new Date()}
          min={min}
          max={max}
          isDisabled={dayDisabled}
        />
      </PopoverContent>
      {name && <input type="hidden" name={name} value={formatISODate(date)} />}
    </Popover>
  );
});
