import { forwardRef, useId, useMemo, type HTMLAttributes } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { addDays, addMonths, daysInMonth, formatISODate, parseISODate, sundayIndex, today } from '../DateExtensions';
import { inputBaseVariants, InputSize } from '../InputStyles';

/** Defines an RFC-5545 recurrence frequency (the `FREQ=` value). */
export const RecurrenceFreq = {
  /** Refers to a daily recurrence. */
  Daily: 'DAILY',
  /** Refers to a weekly recurrence. */
  Weekly: 'WEEKLY',
  /** Refers to a monthly recurrence. */
  Monthly: 'MONTHLY',
  /** Refers to a yearly recurrence. */
  Yearly: 'YEARLY',
} as const;

export type RecurrenceFreq = (typeof RecurrenceFreq)[keyof typeof RecurrenceFreq];

/** Defines an RFC-5545 weekday token (the `BYDAY=` value). */
export const RecurrenceWeekday = {
  /** Refers to Monday. */
  Monday: 'MO',
  /** Refers to Tuesday. */
  Tuesday: 'TU',
  /** Refers to Wednesday. */
  Wednesday: 'WE',
  /** Refers to Thursday. */
  Thursday: 'TH',
  /** Refers to Friday. */
  Friday: 'FR',
  /** Refers to Saturday. */
  Saturday: 'SA',
  /** Refers to Sunday. */
  Sunday: 'SU',
} as const;

export type RecurrenceWeekday = (typeof RecurrenceWeekday)[keyof typeof RecurrenceWeekday];

/** Defines how a recurrence terminates. */
export const RecurrenceEndMode = {
  /** Refers to an open-ended recurrence (no end). */
  Never: 'never',
  /** Refers to ending after a fixed occurrence count. */
  Count: 'count',
  /** Refers to ending on a fixed until-date. */
  Until: 'until',
} as const;

export type RecurrenceEndMode = (typeof RecurrenceEndMode)[keyof typeof RecurrenceEndMode];

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval: number;
  byDay?: ReadonlyArray<RecurrenceWeekday>;
  byMonthDay?: number;
  count?: number;
  until?: Temporal.PlainDate | null;
}

export interface RecurrenceEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  value?: RecurrenceRule;
  defaultValue?: RecurrenceRule;
  onValueChange?: (rule: RecurrenceRule) => void;
  from?: Temporal.PlainDate;
  previewCount?: number;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  /** The hidden input name; when set, emits a hidden input with the serialized `RRULE:` string. */
  name?: string;
}

const ALL_WEEKDAYS: ReadonlyArray<RecurrenceWeekday> = [
  RecurrenceWeekday.Sunday,
  RecurrenceWeekday.Monday,
  RecurrenceWeekday.Tuesday,
  RecurrenceWeekday.Wednesday,
  RecurrenceWeekday.Thursday,
  RecurrenceWeekday.Friday,
  RecurrenceWeekday.Saturday,
];
const WEEKDAY_LABEL: Record<RecurrenceWeekday, string> = {
  [RecurrenceWeekday.Sunday]: 'Su',
  [RecurrenceWeekday.Monday]: 'Mo',
  [RecurrenceWeekday.Tuesday]: 'Tu',
  [RecurrenceWeekday.Wednesday]: 'We',
  [RecurrenceWeekday.Thursday]: 'Th',
  [RecurrenceWeekday.Friday]: 'Fr',
  [RecurrenceWeekday.Saturday]: 'Sa',
};
/* Maps a Sunday-indexed JS weekday (0=Sun … 6=Sat) to its RRULE token. */
const JS_TO_RRULE: ReadonlyArray<RecurrenceWeekday> = [
  RecurrenceWeekday.Sunday,
  RecurrenceWeekday.Monday,
  RecurrenceWeekday.Tuesday,
  RecurrenceWeekday.Wednesday,
  RecurrenceWeekday.Thursday,
  RecurrenceWeekday.Friday,
  RecurrenceWeekday.Saturday,
];

function serializeRule(r: RecurrenceRule): string {
  const parts: Array<string> = [`FREQ=${r.freq}`];
  if (r.interval > 1) parts.push(`INTERVAL=${r.interval}`);
  if (r.byDay && r.byDay.length > 0) parts.push(`BYDAY=${r.byDay.join(',')}`);
  if (r.byMonthDay) parts.push(`BYMONTHDAY=${r.byMonthDay}`);
  if (r.count) parts.push(`COUNT=${r.count}`);
  if (r.until) parts.push(`UNTIL=${formatISODate(r.until).replace(/-/g, '')}`);
  return `RRULE:${parts.join(';')}`;
}

function nextOccurrence(
  rule: RecurrenceRule,
  prev: Temporal.PlainDate,
): Temporal.PlainDate | null {
  switch (rule.freq) {
    case RecurrenceFreq.Daily:
      return addDays(prev, rule.interval);
    case RecurrenceFreq.Weekly: {
      if (!rule.byDay || rule.byDay.length === 0) return addDays(prev, 7 * rule.interval);
      // Find the next allowed weekday in `prev`'s week (weeks start Sunday);
      // exhausted → jump to the week `interval` weeks later and scan it.
      const allowed = new Set(rule.byDay);
      let cursor = addDays(prev, 1);
      while (sundayIndex(cursor) !== 0) {
        if (allowed.has(JS_TO_RRULE[sundayIndex(cursor)]!)) return cursor;
        cursor = addDays(cursor, 1);
      }
      // `cursor` is the Sunday opening the following week; skip interval-1 more weeks.
      cursor = addDays(cursor, 7 * (rule.interval - 1));
      for (let i = 0; i < 7; i++) {
        if (allowed.has(JS_TO_RRULE[sundayIndex(cursor)]!)) return cursor;
        cursor = addDays(cursor, 1);
      }
      return null;
    }
    case RecurrenceFreq.Monthly: {
      const next = addMonths(prev, rule.interval);
      if (rule.byMonthDay) {
        // Clamp to the month's length so day 31 in a 30-day month lands on the last day.
        const day = Math.min(rule.byMonthDay, daysInMonth(next.year, next.month));
        return next.with({ day });
      }
      return next;
    }
    case RecurrenceFreq.Yearly:
      return prev.add({ years: rule.interval });
  }
}

function buildPreview(
  rule: RecurrenceRule,
  from: Temporal.PlainDate,
  count: number,
): ReadonlyArray<Temporal.PlainDate> {
  const out: Array<Temporal.PlainDate> = [];
  let cursor = from;
  // Include `from` if it satisfies the rule (simplification: always include for visual hint).
  out.push(cursor);
  for (let i = 0; i < count - 1; i++) {
    const next = nextOccurrence(rule, cursor);
    if (!next) break;
    if (rule.until && Temporal.PlainDate.compare(next, rule.until) > 0) break;
    if (rule.count && out.length >= rule.count) break;
    out.push(next);
    cursor = next;
  }
  return out;
}

const DEFAULT_RULE: RecurrenceRule = { freq: RecurrenceFreq.Weekly, interval: 1, byDay: [RecurrenceWeekday.Monday] };

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
      from = today(),
      previewCount = 5,
      isDisabled,
      isReadOnly,
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
    const id = useId();

    const preview = useMemo(() => buildPreview(rule, from, previewCount), [rule, from, previewCount]);

    const update = (patch: Partial<RecurrenceRule>) => {
      const next = { ...rule, ...patch };
      // Reset incompatible fields when freq changes.
      if (patch.freq && patch.freq !== rule.freq) {
        if (patch.freq !== RecurrenceFreq.Weekly) next.byDay = undefined;
        if (patch.freq !== RecurrenceFreq.Monthly) next.byMonthDay = undefined;
      }
      setRule(next);
    };

    const endMode: RecurrenceEndMode = rule.count
      ? RecurrenceEndMode.Count
      : rule.until
        ? RecurrenceEndMode.Until
        : RecurrenceEndMode.Never;

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-3 rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm',
          isDisabled && 'opacity-60',
          className,
        )}
        {...rest}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor={`${id}-interval`} className="text-muted-foreground">Every</label>
          <input
            id={`${id}-interval`}
            type="number"
            min={1}
            max={999}
            value={rule.interval}
            disabled={isDisabled}
            readOnly={isReadOnly}
            onChange={(e) => update({ interval: Math.max(1, Number(e.target.value) || 1) })}
            className={cn(inputBaseVariants({ size: InputSize.Sm }), 'w-16')}
          />
          <select
            aria-label="Frequency"
            value={rule.freq}
            disabled={isDisabled}
            onChange={(e) => update({ freq: e.target.value as RecurrenceFreq })}
            className={cn(inputBaseVariants({ size: InputSize.Sm }), 'w-32')}
          >
            <option value="DAILY">{rule.interval > 1 ? 'days' : 'day'}</option>
            <option value="WEEKLY">{rule.interval > 1 ? 'weeks' : 'week'}</option>
            <option value="MONTHLY">{rule.interval > 1 ? 'months' : 'month'}</option>
            <option value="YEARLY">{rule.interval > 1 ? 'years' : 'year'}</option>
          </select>
        </div>

        {rule.freq === RecurrenceFreq.Weekly && (
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
                    disabled={isDisabled || isReadOnly}
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

        {rule.freq === RecurrenceFreq.Monthly && (
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor={`${id}-month-day`} className="text-muted-foreground">On day</label>
            <input
              id={`${id}-month-day`}
              type="number"
              min={1}
              max={31}
              value={rule.byMonthDay ?? from.day}
              disabled={isDisabled}
              readOnly={isReadOnly}
              onChange={(e) => update({ byMonthDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
              className={cn(inputBaseVariants({ size: InputSize.Sm }), 'w-20')}
            />
            <span className="text-muted-foreground">of the month</span>
          </div>
        )}

        <div role="radiogroup" aria-label="End mode" className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${name ?? 'rule'}-end`}
              checked={endMode === RecurrenceEndMode.Never}
              disabled={isDisabled || isReadOnly}
              onChange={() => update({ count: undefined, until: null })}
            />
            Never
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${name ?? 'rule'}-end`}
              checked={endMode === RecurrenceEndMode.Count}
              disabled={isDisabled || isReadOnly}
              onChange={() => update({ count: rule.count ?? 10, until: null })}
            />
            After
            <input
              type="number"
              aria-label="Occurrence count"
              min={1}
              value={rule.count ?? ''}
              disabled={isDisabled || isReadOnly || endMode !== RecurrenceEndMode.Count}
              onChange={(e) => update({ count: Math.max(1, Number(e.target.value) || 1), until: null })}
              className={cn(inputBaseVariants({ size: InputSize.Sm }), 'w-20')}
            />
            occurrences
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${name ?? 'rule'}-end`}
              checked={endMode === RecurrenceEndMode.Until}
              disabled={isDisabled || isReadOnly}
              onChange={() => update({ until: addMonths(from, 6), count: undefined })}
            />
            On
            <input
              type="date"
              aria-label="End date"
              value={formatISODate(rule.until ?? null)}
              disabled={isDisabled || isReadOnly || endMode !== RecurrenceEndMode.Until}
              onChange={(e) => update({ until: parseISODate(e.target.value), count: undefined })}
              className={cn(inputBaseVariants({ size: InputSize.Sm }), 'w-44')}
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
