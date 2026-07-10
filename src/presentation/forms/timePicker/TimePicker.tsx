import { forwardRef, useEffect, useMemo, useRef, type ButtonHTMLAttributes } from 'react';
import { Temporal } from 'temporal-polyfill';
import { Clock } from 'lucide-react';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { selectTriggerVariants, SelectSize, type SelectTriggerVariants } from '../select/Select.variants';
import { InputState } from '../InputStyles';

export interface TimePickerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'defaultValue'>,
    Omit<SelectTriggerVariants, 'size' | 'state'> {
  value?: Temporal.PlainTime | null;
  defaultValue?: Temporal.PlainTime | null;
  onValueChange?: (time: Temporal.PlainTime | null) => void;
  /** The minute interval. Default 5. */
  minuteStep?: number;
  placeholder?: string;
  format?: (time: Temporal.PlainTime) => string;
  isInvalid?: boolean;
  name?: string;
  /** The trigger size. */
  size?: SelectSize;
  /** The validity surface. */
  state?: InputState;
}

const defaultFormat = (t: Temporal.PlainTime) => t.toString({ smallestUnit: 'minute' });

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(function TimePicker(
  {
    value,
    defaultValue,
    onValueChange,
    minuteStep = 5,
    placeholder = 'Pick a time',
    format = defaultFormat,
    isInvalid,
    name,
    size,
    state,
    className,
    disabled,
    id,
    'aria-label': ariaLabel,
    ...rest
  },
  forwardedRef,
) {
  /* Inherits id/disabled/invalid/labelledby/describedby from a surrounding <Field>;
     standalone props win when provided, context fills the gaps (Select parity). */
  const field = useFormControl();
  const finalDisabled = disabled ?? field?.isDisabled;
  const finalInvalid = isInvalid ?? field?.isInvalid;

  const [time, setTime] = useControlled<Temporal.PlainTime | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange: onValueChange,
  });
  const [open, setOpen] = useControlled<boolean>({
    controlled: undefined,
    default: false,
  });
  const hoursRef = useRef<HTMLDivElement | null>(null);
  const minutesRef = useRef<HTMLDivElement | null>(null);

  const minutes = useMemo(() => {
    const list: Array<number> = [];
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

  const triggerState = state ?? (finalInvalid ? InputState.Invalid : InputState.Default);

  const update = (next: { hour?: number; minute?: number }) => {
    const merged = Temporal.PlainTime.from({
      hour: next.hour ?? time?.hour ?? 0,
      minute: next.minute ?? time?.minute ?? 0,
    });
    setTime(merged);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} placement="bottom-start" offset={6}>
      <PopoverTrigger asChild>
        <button
          ref={forwardedRef}
          type="button"
          id={id ?? field?.id}
          disabled={finalDisabled}
          aria-invalid={triggerState === InputState.Invalid || undefined}
          aria-label={ariaLabel}
          /* Names the trigger from the Field label when present; an explicit aria-label always wins. */
          aria-labelledby={ariaLabel ? undefined : field?.labelledBy}
          aria-describedby={field?.describedBy}
          className={cn(selectTriggerVariants({ size, state: triggerState }), className)}
          {...rest}
        >
          {/* `muted-foreground` (not `subtle-foreground`): the trigger surface is muted, where subtle is only 4.2:1 (see index.css). */}
          <span className={cn('truncate', !time && 'text-muted-foreground')}>
            {time ? format(time) : placeholder}
          </span>
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent isBare>
        <div className="flex gap-1 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-md">
          <div
            ref={hoursRef}
            role="listbox"
            aria-label="Hours"
            className="flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1"
          >
            {HOURS.map((h) => {
              const selected = time?.hour === h;
              return (
                <button
                  key={h}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-selected={selected ? '' : undefined}
                  onClick={() => update({ hour: h })}
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
              const selected = time?.minute === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-selected={selected ? '' : undefined}
                  onClick={() => update({ minute: m })}
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
        <input type="hidden" name={name} value={time.toString({ smallestUnit: 'minute' })} />
      )}
    </Popover>
  );
});
