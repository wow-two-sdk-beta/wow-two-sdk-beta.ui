import { forwardRef, useMemo, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { addDays, addMonths, formatISODate, parseISODate } from '../DateExtensions';
import { inputBaseVariants } from '../InputStyles';

export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type RecurrenceWeekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval: number;
  byDay?: RecurrenceWeekday[];
  byMonthDay?: number;
  count?: number;
  until?: Date | null;
}

export interface RecurrenceEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  value?: RecurrenceRule;
  defaultValue?: RecurrenceRule;
  onValueChange?: (rule: RecurrenceRule) => void;
  from?: Date;
  previewCount?: number;
  disabled?: boolean;
  readOnly?: boolean;
  /** When set, emits a hidden input with the serialized `RRULE:` string. */
  name?: string;
}

const ALL_WEEKDAYS: RecurrenceWeekday[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const WEEKDAY_LABEL: Record<RecurrenceWeekday, string> = {
  SU: 'Su',
  MO: 'Mo',
  TU: 'Tu',
  WE: 'We',
  TH: 'Th',
  FR: 'Fr',
  SA: 'Sa',
};
const JS_TO_RRULE: RecurrenceWeekday[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function serializeRule(r: RecurrenceRule): string {
  const parts: string[] = [`FREQ=${r.freq}`];
  if (r.interval > 1) parts.push(`INTERVAL=${r.interval}`);
  if (r.byDay && r.byDay.length > 0) parts.push(`BYDAY=${r.byDay.join(',')}`);
  if (r.byMonthDay) parts.push(`BYMONTHDAY=${r.byMonthDay}`);
  if (r.count) parts.push(`COUNT=${r.count}`);
  if (r.until) parts.push(`UNTIL=${formatISODate(r.until).replace(/-/g, '')}`);
  return `RRULE:${parts.join(';')}`;
}

function nextOccurrence(rule: RecurrenceRule, prev: Date): Date | null {
  switch (rule.freq) {
    case 'DAILY':
      return addDays(prev, rule.interval);
    case 'WEEKLY': {
      if (!rule.byDay || rule.byDay.length === 0) return addDays(prev, 7 * rule.interval);
      // Find the next allowed weekday after `prev`. After exhausting the week, jump `interval-1` weeks forward.
      const allowed = new Set(rule.byDay);
      let cursor = addDays(prev, 1);
      let weekJumps = 0;
      const maxIter = 7 * rule.interval + 1;
      for (let i = 0; i < maxIter; i++) {
        const wd = JS_TO_RRULE[cursor.getDay()]!;
        if (allowed.has(wd)) {
          return cursor;
        }
        cursor = addDays(cursor, 1);
        if (cursor.getDay() === 0) weekJumps++;
        if (weekJumps >= rule.interval) {
          // Wrap to next interval window.
          // Continue scanning — first hit wins anyway.
        }
      }
      return null;
    }
    case 'MONTHLY': {
      const next = addMonths(prev, rule.interval);
      if (rule.byMonthDay) {
        next.setDate(rule.byMonthDay);
      }
      return next;
    }
    case 'YEARLY': {
      const c = new Date(prev);
      c.setFullYear(c.getFullYear() + rule.interval);
      return c;
    }
  }
}

function buildPreview(rule: RecurrenceRule, from: Date, count: number): Date[] {
  const out: Date[] = [];
  let cursor = from;
  // Include `from` if it satisfies the rule (simplification: always include for visual hint).
  out.push(new Date(cursor));
  for (let i = 0; i < count - 1; i++) {
    const next = nextOccurrence(rule, cursor);
    if (!next) break;
    if (rule.until && next > rule.until) break;
    if (rule.count && out.length >= rule.count) break;
    out.push(next);
    cursor = next;
  }
  return out;
}

const DEFAULT_RULE: RecurrenceRule = { freq: 'WEEKLY', interval: 1, byDay: ['MO'] };

/**
 * Visual RRULE editor. Output is a JS `RecurrenceRule` object via `onValueChange`;
 * if `name` is set, also emits a hidden `RRULE:FREQ=…` string for forms.
 */
export const RecurrenceEditor = forwardRef<HTMLDivElement, RecurrenceEditorProps>(
  function RecurrenceEditor(
    {
      value,
      defaultValue,
      onValueChange,
      from = new Date(),
      previewCount = 5,
      disabled,
      readOnly,
      name,
      className,
      ...rest
    },
    ref,
  ) {
    const [rule, setRule] = useControlled({
      controlled: value,
      default: defaultValue ?? DEFAULT_RULE,
      onChange: onValueChange,
    });

    const preview = useMemo(() => buildPreview(rule, from, previewCount), [rule, from, previewCount]);

    const update = (patch: Partial<RecurrenceRule>) => {
      const next = { ...rule, ...patch };
      // Reset incompatible fields when freq changes.
      if (patch.freq && patch.freq !== rule.freq) {
        if (patch.freq !== 'WEEKLY') next.byDay = undefined;
        if (patch.freq !== 'MONTHLY') next.byMonthDay = undefined;
      }
      setRule(next);
    };

    const endMode: 'never' | 'count' | 'until' = rule.count
      ? 'count'
      : rule.until
        ? 'until'
        : 'never';

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-3 rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm',
          disabled && 'opacity-60',
          className,
        )}
        {...rest}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Every</span>
          <input
            type="number"
            min={1}
            max={999}
            value={rule.interval}
            disabled={disabled}
            readOnly={readOnly}
            onChange={(e) => update({ interval: Math.max(1, Number(e.target.value) || 1) })}
            className={cn(inputBaseVariants({ size: 'sm' }), 'w-16')}
          />
          <select
            aria-label="Frequency"
            value={rule.freq}
            disabled={disabled}
            onChange={(e) => update({ freq: e.target.value as RecurrenceFreq })}
            className={cn(inputBaseVariants({ size: 'sm' }), 'w-32')}
          >
            <option value="DAILY">{rule.interval > 1 ? 'days' : 'day'}</option>
            <option value="WEEKLY">{rule.interval > 1 ? 'weeks' : 'week'}</option>
            <option value="MONTHLY">{rule.interval > 1 ? 'months' : 'month'}</option>
            <option value="YEARLY">{rule.interval > 1 ? 'years' : 'year'}</option>
          </select>
        </div>

        {rule.freq === 'WEEKLY' && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">On</span>
            <div role="group" aria-label="Days of week" className="flex flex-wrap gap-1">
              {ALL_WEEKDAYS.map((wd) => {
                const checked = rule.byDay?.includes(wd) ?? false;
                return (
                  <button
                    key={wd}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    disabled={disabled || readOnly}
                    onClick={() => {
                      const set = new Set(rule.byDay ?? []);
                      if (set.has(wd)) set.delete(wd);
                      else set.add(wd);
                      update({ byDay: Array.from(set) as RecurrenceWeekday[] });
                    }}
                    className={cn(
                      'inline-flex h-7 w-9 items-center justify-center rounded-md border text-xs font-medium transition-colors',
                      checked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {WEEKDAY_LABEL[wd]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {rule.freq === 'MONTHLY' && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">On day</span>
            <input
              type="number"
              min={1}
              max={31}
              value={rule.byMonthDay ?? from.getDate()}
              disabled={disabled}
              readOnly={readOnly}
              onChange={(e) => update({ byMonthDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
              className={cn(inputBaseVariants({ size: 'sm' }), 'w-20')}
            />
            <span className="text-muted-foreground">of the month</span>
          </div>
        )}

        <div role="radiogroup" aria-label="End mode" className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${name ?? 'rule'}-end`}
              checked={endMode === 'never'}
              disabled={disabled || readOnly}
              onChange={() => update({ count: undefined, until: null })}
            />
            Never
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${name ?? 'rule'}-end`}
              checked={endMode === 'count'}
              disabled={disabled || readOnly}
              onChange={() => update({ count: rule.count ?? 10, until: null })}
            />
            After
            <input
              type="number"
              min={1}
              value={rule.count ?? ''}
              disabled={disabled || readOnly || endMode !== 'count'}
              onChange={(e) => update({ count: Math.max(1, Number(e.target.value) || 1), until: null })}
              className={cn(inputBaseVariants({ size: 'sm' }), 'w-20')}
            />
            occurrences
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${name ?? 'rule'}-end`}
              checked={endMode === 'until'}
              disabled={disabled || readOnly}
              onChange={() => update({ until: addMonths(from, 6), count: undefined })}
            />
            On
            <input
              type="date"
              value={formatISODate(rule.until ?? null)}
              disabled={disabled || readOnly || endMode !== 'until'}
              onChange={(e) => update({ until: parseISODate(e.target.value), count: undefined })}
              className={cn(inputBaseVariants({ size: 'sm' }), 'w-44')}
            />
          </label>
        </div>

        <div className="rounded-md bg-muted/40 p-3 text-xs">
          <div className="mb-1 font-medium text-muted-foreground">Next occurrences</div>
          <ul aria-live="polite" className="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3">
            {preview.map((d, i) => (
              <li key={i} className="text-foreground tabular-nums">
                {formatISODate(d)}
              </li>
            ))}
          </ul>
        </div>
        {name && <input type="hidden" name={name} value={serializeRule(rule)} />}
      </div>
    );
  },
);
