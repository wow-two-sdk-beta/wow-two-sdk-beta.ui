import { forwardRef, useMemo, type InputHTMLAttributes } from 'react';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { inputBaseVariants, InputSize, InputState, type InputBaseVariants } from '../InputStyles';

export interface CronInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'size'>,
    Omit<InputBaseVariants, 'size' | 'state'> {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  isInvalid?: boolean;
  hasPreview?: boolean;
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Defines the parsed form of a single cron field (one of the five positions). */
export const CronFieldKind = {
  /** Refers to `*` — every value. */
  Every: 'every',
  /** Refers to a single specific value (`N`). */
  Specific: 'specific',
  /** Refers to an inclusive range (`N-M`). */
  Range: 'range',
  /** Refers to a comma list (`N,M,O`). */
  List: 'list',
  /** Refers to a step expression such as `* / N`. */
  Step: 'step',
  /** Refers to an unparseable / out-of-bounds field. */
  Invalid: 'invalid',
} as const;

export type CronFieldKind = (typeof CronFieldKind)[keyof typeof CronFieldKind];

interface CronField {
  raw: string;
  kind: CronFieldKind;
  value?: number | ReadonlyArray<number>;
  step?: number;
  range?: [number, number];
}

function parseField(raw: string, min: number, max: number): CronField {
  if (raw === '*') return { raw, kind: CronFieldKind.Every };
  // Step: "*/N" or "from-to/N" — only support "*/N" first-gen.
  if (/^\*\/(\d+)$/.test(raw)) {
    const step = Number(raw.slice(2));
    if (step < 1 || step > max) return { raw, kind: CronFieldKind.Invalid };
    return { raw, kind: CronFieldKind.Step, step };
  }
  // Range: "N-M".
  if (/^(\d+)-(\d+)$/.test(raw)) {
    const [a, b] = raw.split('-').map(Number);
    if (a == null || b == null || a < min || b > max || a > b) return { raw, kind: CronFieldKind.Invalid };
    return { raw, kind: CronFieldKind.Range, range: [a, b] };
  }
  // List: "N,M,O".
  if (/^\d+(,\d+)+$/.test(raw)) {
    const parts = raw.split(',').map(Number);
    if (parts.some((p) => p < min || p > max)) return { raw, kind: CronFieldKind.Invalid };
    return { raw, kind: CronFieldKind.List, value: parts };
  }
  // Specific number.
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    if (n < min || n > max) return { raw, kind: CronFieldKind.Invalid };
    return { raw, kind: CronFieldKind.Specific, value: n };
  }
  return { raw, kind: CronFieldKind.Invalid };
}

function describeField(field: CronField, names?: ReadonlyArray<string>, unit = '', plural = ''): string {
  if (field.kind === CronFieldKind.Every) return '*';
  if (field.kind === CronFieldKind.Invalid) return '?';
  if (field.kind === CronFieldKind.Step && field.step != null) return `every ${field.step} ${plural || unit + 's'}`;
  if (field.kind === CronFieldKind.Range && field.range) {
    const [a, b] = field.range;
    const aLabel = names?.[a] ?? a;
    const bLabel = names?.[b] ?? b;
    return `${aLabel} through ${bLabel}`;
  }
  if (field.kind === CronFieldKind.List && Array.isArray(field.value)) {
    return field.value.map((v) => names?.[v] ?? v).join(', ');
  }
  if (field.kind === CronFieldKind.Specific && typeof field.value === 'number') {
    return String(names?.[field.value] ?? field.value);
  }
  return field.raw;
}

function parseCron(value: string): string {
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 5) return 'Cron expressions must have 5 fields (min hour dom month dow).';
  const [minRaw, hourRaw, domRaw, monRaw, dowRaw] = parts as [string, string, string, string, string];
  const minute = parseField(minRaw, 0, 59);
  const hour = parseField(hourRaw, 0, 23);
  const dom = parseField(domRaw, 1, 31);
  const month = parseField(monRaw, 1, 12);
  const dow = parseField(dowRaw, 0, 6);

  if ([minute, hour, dom, month, dow].some((f) => f.kind === CronFieldKind.Invalid)) {
    return 'Invalid cron expression.';
  }

  // Common-case readouts.
  if (minute.kind === CronFieldKind.Step && hour.kind === CronFieldKind.Every && dom.kind === CronFieldKind.Every && month.kind === CronFieldKind.Every && dow.kind === CronFieldKind.Every) {
    return `Every ${minute.step} minutes`;
  }
  if (minute.kind === CronFieldKind.Every && hour.kind === CronFieldKind.Step && dom.kind === CronFieldKind.Every && month.kind === CronFieldKind.Every && dow.kind === CronFieldKind.Every) {
    return `Every ${hour.step} hours`;
  }
  if (
    minute.kind === CronFieldKind.Specific &&
    hour.kind === CronFieldKind.Specific &&
    dom.kind === CronFieldKind.Every &&
    month.kind === CronFieldKind.Every &&
    dow.kind === CronFieldKind.Every
  ) {
    return `Every day at ${String(hour.value).padStart(2, '0')}:${String(minute.value).padStart(2, '0')}`;
  }
  if (
    minute.kind === CronFieldKind.Specific &&
    hour.kind === CronFieldKind.Specific &&
    dom.kind === CronFieldKind.Every &&
    month.kind === CronFieldKind.Every &&
    (dow.kind === CronFieldKind.List || dow.kind === CronFieldKind.Specific)
  ) {
    return `At ${String(hour.value).padStart(2, '0')}:${String(minute.value).padStart(2, '0')} on ${describeField(dow, WEEKDAY_NAMES)}`;
  }
  if (minute.kind === CronFieldKind.Every && hour.kind === CronFieldKind.Every && dom.kind === CronFieldKind.Every && month.kind === CronFieldKind.Every && dow.kind === CronFieldKind.Every) {
    return 'Every minute';
  }
  // Fallback — describe each field.
  const parts2 = [];
  if (minute.kind !== CronFieldKind.Every) parts2.push(`minute: ${describeField(minute, undefined, 'minute')}`);
  if (hour.kind !== CronFieldKind.Every) parts2.push(`hour: ${describeField(hour, undefined, 'hour')}`);
  if (dom.kind !== CronFieldKind.Every) parts2.push(`day: ${describeField(dom)}`);
  if (month.kind !== CronFieldKind.Every) parts2.push(`month: ${describeField(month, ['', ...MONTH_NAMES])}`);
  if (dow.kind !== CronFieldKind.Every) parts2.push(`weekday: ${describeField(dow, WEEKDAY_NAMES)}`);
  return parts2.length === 0 ? 'Every minute' : parts2.join(' · ');
}

/**
 * Cron-string input with human-readable preview. Supports asterisk, N,
 * step (asterisk-slash-N), N-M, N,M,O per field. Quartz extensions
 * (?, L, W, #) deferred.
 */
export const CronInput = forwardRef<HTMLInputElement, CronInputProps>(
  function CronInput(
    {
      value: valueProp,
      defaultValue,
      onValueChange,
      placeholder = '* * * * *',
      isInvalid,
      size,
      state,
      hasPreview = true,
      disabled,
      readOnly,
      name,
      className,
      ...rest
    },
    ref,
  ) {
    const [value, setValue] = useControlled<string>({
      controlled: valueProp,
      default: defaultValue ?? '*/5 * * * *',
      onChange: onValueChange,
    });
    const preview = useMemo(() => parseCron(value), [value]);
    const isError = isInvalid || preview.startsWith('Invalid') || preview.startsWith('Cron');
    const inputState = isError ? InputState.Invalid : (state ?? InputState.Default);

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <input
          {...rest}
          ref={ref}
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={isError || undefined}
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
          className={cn(inputBaseVariants({ size, state: inputState }), 'font-mono')}
        />
        {hasPreview && (
          <div
            aria-live="polite"
            className={cn(
              'px-1 text-xs',
              isError ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {preview}
          </div>
        )}
        {name && <input type="hidden" name={name} value={value} />}
      </div>
    );
  },
);
