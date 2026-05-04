import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { selectTriggerVariants, type SelectTriggerVariants } from '../select/Select.variants';
import { formatISODate } from '../DateExtensions';
import { RangeCalendar, type DateRange } from '../rangeCalendar';

export interface DateRangePickerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'defaultValue'>,
    SelectTriggerVariants {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onChange?: (range: DateRange | null) => void;
  placeholder?: string;
  format?: (date: Date) => string;
  min?: Date | null;
  max?: Date | null;
  isDisabled?: (date: Date) => boolean;
  invalid?: boolean;
  /** When `name` is set, two hidden inputs (`{name}_start`, `{name}_end`) ship the ISO values. */
  name?: string;
}

const defaultFormat = (d: Date) =>
  d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const DateRangePicker = forwardRef<HTMLButtonElement, DateRangePickerProps>(
  function DateRangePicker(
    {
      value,
      defaultValue,
      onChange,
      placeholder = 'Pick a range',
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
    const [range, setRange] = useControlled<DateRange | null>({
      controlled: value,
      default: defaultValue ?? null,
      onChange,
    });
    const [open, setOpen] = useControlled<boolean>({
      controlled: undefined,
      default: false,
    });
    const triggerState = state ?? (invalid ? 'invalid' : 'default');

    // Auto-close when both ends are picked.
    const wasComplete = useRef(false);
    useEffect(() => {
      const complete = !!(range?.start && range?.end);
      if (complete && !wasComplete.current && open) {
        setOpen(false);
      }
      wasComplete.current = complete;
    }, [range, open, setOpen]);

    const display = range?.start
      ? range.end
        ? `${format(range.start)} → ${format(range.end)}`
        : `${format(range.start)} → …`
      : null;

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
            <span className={cn('truncate', !display && 'text-subtle-foreground')}>
              {display ?? placeholder}
            </span>
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent bare>
          <RangeCalendar
            value={range}
            onChange={setRange}
            defaultMonth={range?.start ?? new Date()}
            min={min}
            max={max}
            isDisabled={dayDisabled}
          />
        </PopoverContent>
        {name && (
          <>
            <input type="hidden" name={`${name}_start`} value={formatISODate(range?.start)} />
            <input type="hidden" name={`${name}_end`} value={formatISODate(range?.end)} />
          </>
        )}
      </Popover>
    );
  },
);
