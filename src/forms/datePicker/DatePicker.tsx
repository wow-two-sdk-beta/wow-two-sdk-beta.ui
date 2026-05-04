import { forwardRef, useRef, type ButtonHTMLAttributes } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { cn, composeRefs } from '../../utils';
import { useControlled } from '../../hooks';
import { AnchoredPositioner, DismissableLayer, Portal } from '../../primitives';
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
    onClick,
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const triggerState = state ?? (invalid ? 'invalid' : 'default');

  return (
    <>
      <button
        ref={composeRefs(forwardedRef, triggerRef)}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-state={open ? 'open' : 'closed'}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          setOpen(!open);
        }}
        className={cn(selectTriggerVariants({ size, state: triggerState }), className)}
        {...rest}
      >
        <span className={cn('truncate', !date && 'text-subtle-foreground')}>
          {date ? format(date) : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <Portal>
          <AnchoredPositioner anchor={triggerRef.current} placement="bottom-start" offset={6}>
            <FocusScope asChild trapped loop>
              <DismissableLayer
                onEscape={() => {
                  setOpen(false);
                  requestAnimationFrame(() => triggerRef.current?.focus());
                }}
                onOutsidePointerDown={(e) => {
                  if (triggerRef.current?.contains(e.target as Node)) return;
                  setOpen(false);
                }}
              >
                <Calendar
                  value={date}
                  onChange={(d) => {
                    setDate(d);
                    setOpen(false);
                    requestAnimationFrame(() => triggerRef.current?.focus());
                  }}
                  defaultMonth={date ?? new Date()}
                  min={min}
                  max={max}
                  isDisabled={dayDisabled}
                  className="shadow-md"
                />
              </DismissableLayer>
            </FocusScope>
          </AnchoredPositioner>
        </Portal>
      )}
      {name && <input type="hidden" name={name} value={formatISODate(date)} />}
    </>
  );
});
