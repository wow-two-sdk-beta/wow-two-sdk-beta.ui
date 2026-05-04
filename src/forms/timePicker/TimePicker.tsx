import { forwardRef, useEffect, useMemo, useRef, type ButtonHTMLAttributes } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { selectTriggerVariants, type SelectTriggerVariants } from '../select/Select.variants';
import { type TimeValue } from '../timeField';

export interface TimePickerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'defaultValue'>,
    SelectTriggerVariants {
  value?: TimeValue | null;
  defaultValue?: TimeValue | null;
  onChange?: (time: TimeValue | null) => void;
  /** Minute interval. Default 5. */
  minuteStep?: number;
  placeholder?: string;
  format?: (time: TimeValue) => string;
  invalid?: boolean;
  name?: string;
}

const defaultFormat = (t: TimeValue) =>
  `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`;

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(function TimePicker(
  {
    value,
    defaultValue,
    onChange,
    minuteStep = 5,
    placeholder = 'Pick a time',
    format = defaultFormat,
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
  const [time, setTime] = useControlled<TimeValue | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange,
  });
  const [open, setOpen] = useControlled<boolean>({
    controlled: undefined,
    default: false,
  });
  const hoursRef = useRef<HTMLDivElement | null>(null);
  const minutesRef = useRef<HTMLDivElement | null>(null);

  const minutes = useMemo(() => {
    const list: number[] = [];
    for (let m = 0; m < 60; m += minuteStep) list.push(m);
    return list;
  }, [minuteStep]);

  // Auto-scroll selected hour/minute into view when opening.
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      hoursRef.current
        ?.querySelector<HTMLButtonElement>('[data-selected]')
        ?.scrollIntoView({ block: 'center' });
      minutesRef.current
        ?.querySelector<HTMLButtonElement>('[data-selected]')
        ?.scrollIntoView({ block: 'center' });
    });
  }, [open]);

  const triggerState = state ?? (invalid ? 'invalid' : 'default');

  const update = (next: Partial<TimeValue>) => {
    const merged: TimeValue = {
      hours: next.hours ?? time?.hours ?? 0,
      minutes: next.minutes ?? time?.minutes ?? 0,
    };
    setTime(merged);
  };

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
          <span className={cn('truncate', !time && 'text-subtle-foreground')}>
            {time ? format(time) : placeholder}
          </span>
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent bare>
        <div className="flex gap-1 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-md">
          <div
            ref={hoursRef}
            role="listbox"
            aria-label="Hours"
            className="flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1"
          >
            {HOURS.map((h) => {
              const selected = time?.hours === h;
              return (
                <button
                  key={h}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-selected={selected ? '' : undefined}
                  onClick={() => update({ hours: h })}
                  className={cn(
                    'grid h-8 w-12 place-items-center rounded-sm text-sm transition-colors hover:bg-muted',
                    selected && 'bg-primary text-primary-foreground hover:bg-primary',
                  )}
                >
                  {String(h).padStart(2, '0')}
                </button>
              );
            })}
          </div>
          <div className="w-px self-stretch bg-border" />
          <div
            ref={minutesRef}
            role="listbox"
            aria-label="Minutes"
            className="flex max-h-56 flex-col gap-0.5 overflow-y-auto pl-1"
          >
            {minutes.map((m) => {
              const selected = time?.minutes === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-selected={selected ? '' : undefined}
                  onClick={() => update({ minutes: m })}
                  className={cn(
                    'grid h-8 w-12 place-items-center rounded-sm text-sm transition-colors hover:bg-muted',
                    selected && 'bg-primary text-primary-foreground hover:bg-primary',
                  )}
                >
                  {String(m).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
      {name && time && (
        <input
          type="hidden"
          name={name}
          value={`${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`}
        />
      )}
    </Popover>
  );
});
