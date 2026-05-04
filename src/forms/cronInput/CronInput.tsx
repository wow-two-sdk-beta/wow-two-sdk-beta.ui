import { forwardRef, useMemo, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { inputBaseVariants, type InputBaseVariants } from '../InputStyles';

export interface CronInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'size'>,
    InputBaseVariants {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  invalid?: boolean;
  showPreview?: boolean;
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

interface CronField {
  raw: string;
  kind: 'every' | 'specific' | 'range' | 'list' | 'step' | 'invalid';
  value?: number | number[];
  step?: number;
  range?: [number, number];
}

function parseField(raw: string, min: number, max: number): CronField {
  if (raw === '*') return { raw, kind: 'every' };
  // Step: "*/N" or "from-to/N" — only support "*/N" first-gen.
  if (/^\*\/(\d+)$/.test(raw)) {
    const step = Number(raw.slice(2));
    if (step < 1 || step > max) return { raw, kind: 'invalid' };
    return { raw, kind: 'step', step };
  }
  // Range: "N-M".
  if (/^(\d+)-(\d+)$/.test(raw)) {
    const [a, b] = raw.split('-').map(Number);
    if (a == null || b == null || a < min || b > max || a > b) return { raw, kind: 'invalid' };
    return { raw, kind: 'range', range: [a, b] };
  }
  // List: "N,M,O".
  if (/^\d+(,\d+)+$/.test(raw)) {
    const parts = raw.split(',').map(Number);
    if (parts.some((p) => p < min || p > max)) return { raw, kind: 'invalid' };
    return { raw, kind: 'list', value: parts };
  }
  // Specific number.
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    if (n < min || n > max) return { raw, kind: 'invalid' };
    return { raw, kind: 'specific', value: n };
  }
  return { raw, kind: 'invalid' };
}

function describeField(field: CronField, names?: string[], unit = '', plural = ''): string {
  if (field.kind === 'every') return '*';
  if (field.kind === 'invalid') return '?';
  if (field.kind === 'step' && field.step != null) return `every ${field.step} ${plural || unit + 's'}`;
  if (field.kind === 'range' && field.range) {
    const [a, b] = field.range;
    const aLabel = names?.[a] ?? a;
    const bLabel = names?.[b] ?? b;
    return `${aLabel} through ${bLabel}`;
  }
  if (field.kind === 'list' && Array.isArray(field.value)) {
    return field.value.map((v) => names?.[v] ?? v).join(', ');
  }
  if (field.kind === 'specific' && typeof field.value === 'number') {
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

  if ([minute, hour, dom, month, dow].some((f) => f.kind === 'invalid')) {
    return 'Invalid cron expression.';
  }

  // Common-case readouts.
  if (minute.kind === 'step' && hour.kind === 'every' && dom.kind === 'every' && month.kind === 'every' && dow.kind === 'every') {
    return `Every ${minute.step} minutes`;
  }
  if (minute.kind === 'every' && hour.kind === 'step' && dom.kind === 'every' && month.kind === 'every' && dow.kind === 'every') {
    return `Every ${hour.step} hours`;
  }
  if (
    minute.kind === 'specific' &&
    hour.kind === 'specific' &&
    dom.kind === 'every' &&
    month.kind === 'every' &&
    dow.kind === 'every'
  ) {
    return `Every day at ${String(hour.value).padStart(2, '0')}:${String(minute.value).padStart(2, '0')}`;
  }
  if (
    minute.kind === 'specific' &&
    hour.kind === 'specific' &&
    dom.kind === 'every' &&
    month.kind === 'every' &&
    (dow.kind === 'list' || dow.kind === 'specific')
  ) {
    return `At ${String(hour.value).padStart(2, '0')}:${String(minute.value).padStart(2, '0')} on ${describeField(dow, WEEKDAY_NAMES)}`;
  }
  if (minute.kind === 'every' && hour.kind === 'every' && dom.kind === 'every' && month.kind === 'every' && dow.kind === 'every') {
    return 'Every minute';
  }
  // Fallback — describe each field.
  const parts2 = [];
  if (minute.kind !== 'every') parts2.push(`minute: ${describeField(minute, undefined, 'minute')}`);
  if (hour.kind !== 'every') parts2.push(`hour: ${describeField(hour, undefined, 'hour')}`);
  if (dom.kind !== 'every') parts2.push(`day: ${describeField(dom)}`);
  if (month.kind !== 'every') parts2.push(`month: ${describeField(month, ['', ...MONTH_NAMES])}`);
  if (dow.kind !== 'every') parts2.push(`weekday: ${describeField(dow, WEEKDAY_NAMES)}`);
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
      invalid,
      size,
      state,
      showPreview = true,
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
    const isError = invalid || preview.startsWith('Invalid') || preview.startsWith('Cron');
    const inputState = isError ? 'invalid' : (state ?? 'default');

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
        {showPreview && (
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
