import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes } from 'react';
import { Temporal } from 'temporal-polyfill';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { selectTriggerVariants, SelectSize, type SelectTriggerVariants } from '../select/Select.variants';
import { InputState } from '../InputStyles';
import { formatISODate, today } from '../DateExtensions';
import { RangeCalendar, type DateRange } from '../rangeCalendar';

export interface DateRangePickerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'defaultValue'>,
    Omit<SelectTriggerVariants, 'size' | 'state'> {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange | null) => void;
  placeholder?: string;
  format?: (date: Temporal.PlainDate) => string;
  min?: Temporal.PlainDate | null;
  max?: Temporal.PlainDate | null;
  isDisabled?: (date: Temporal.PlainDate) => boolean;
  isInvalid?: boolean;
  /** The hidden input name; when set, two hidden inputs (`{name}_start`, `{name}_end`) ship the ISO values. */
  name?: string;
  /** The trigger size. */
  size?: SelectSize;
  /** The validity surface. */
  state?: InputState;
}

const defaultFormat = (d: Temporal.PlainDate) =>
  d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const DateRangePicker = forwardRef<HTMLButtonElement, DateRangePickerProps>(
  function DateRangePicker(
    {
      value,
      defaultValue,
      onValueChange,
      placeholder = 'Pick a range',
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
    const [range, setRange] = useControlled<DateRange | null>({
      controlled: value,
      default: defaultValue ?? null,
      onChange: onValueChange,
    });
    const [open, setOpen] = useControlled<boolean>({
      controlled: undefined,
      default: false,
    });
    const triggerState = state ?? (isInvalid ? InputState.Invalid : InputState.Default);

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
            {/* `muted-foreground` (not `subtle-foreground`): the trigger surface is muted, where subtle is only 4.2:1 (see index.css). */}
            <span className={cn('truncate', !display && 'text-muted-foreground')}>
              {display ?? placeholder}
            </span>
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent isBare>
          <RangeCalendar
            value={range}
            onValueChange={setRange}
            defaultMonth={range?.start ?? today()}
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
