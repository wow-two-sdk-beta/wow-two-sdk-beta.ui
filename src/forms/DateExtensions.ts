// Shared date helpers for Calendar / DatePicker / DateField / RangeCalendar.
// Co-located in `forms/` so imports stay within-domain.
//
// Temporal-based — the ecosystem standardizes on the Temporal API (dates =
// `Temporal.*`). `Temporal.PlainDate` carries calendar math (no timezone), so
// these helpers are inherently local/wall-clock, which is what calendar UIs want.
// `Temporal.PlainTime` carries hour/minute for the time components.

import { Temporal } from '@js-temporal/polyfill';

export const WEEKDAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export const MONTHS_LONG = [
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

/** Sunday-anchored column index (0 = Sun … 6 = Sat) for a PlainDate. */
export function sundayIndex(d: Temporal.PlainDate): number {
  // Temporal `dayOfWeek` is 1 (Mon) … 7 (Sun); map Sunday to 0 for our Su-first grid.
  return d.dayOfWeek % 7;
}

/** Today as a PlainDate in the local time zone. */
export function today(): Temporal.PlainDate {
  return Temporal.Now.plainDateISO();
}

export function isSameDay(
  a: Temporal.PlainDate | null | undefined,
  b: Temporal.PlainDate | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.equals(b);
}

export function isToday(d: Temporal.PlainDate): boolean {
  return d.equals(today());
}

/** Add `n` months; Temporal clamps to the target month's last day (Jan 31 +1 → Feb 28). */
export function addMonths(d: Temporal.PlainDate, n: number): Temporal.PlainDate {
  return d.add({ months: n });
}

export function addDays(d: Temporal.PlainDate, n: number): Temporal.PlainDate {
  return d.add({ days: n });
}

/** First day of `d`'s month. */
export function startOfMonth(d: Temporal.PlainDate): Temporal.PlainDate {
  return d.with({ day: 1 });
}

/** Number of days in the given year/month (1-indexed month). */
export function daysInMonth(year: number, month: number): number {
  return Temporal.PlainDate.from({ year, month, day: 1 }).daysInMonth;
}

/**
 * Build the 6-week (42-cell) grid that the calendar UI renders.
 * `year`/`month` are 1-indexed (Temporal convention). Cells outside the target
 * month carry `outOfMonth: true`.
 */
export function buildMonthGrid(
  year: number,
  month: number,
): { date: Temporal.PlainDate; outOfMonth: boolean }[] {
  const first = Temporal.PlainDate.from({ year, month, day: 1 });
  const start = first.subtract({ days: sundayIndex(first) });
  const cells: { date: Temporal.PlainDate; outOfMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const date = start.add({ days: i });
    cells.push({ date, outOfMonth: date.month !== month });
  }
  return cells;
}

/** Format PlainDate → "YYYY-MM-DD" for a native `<input type="date">` value. */
export function formatISODate(d: Temporal.PlainDate | null | undefined): string {
  if (!d) return '';
  return d.toString();
}

/** Parse "YYYY-MM-DD" → PlainDate. Returns null for invalid input. */
export function parseISODate(s: string | null | undefined): Temporal.PlainDate | null {
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  try {
    return Temporal.PlainDate.from(s, { overflow: 'reject' });
  } catch {
    return null;
  }
}

/** Format PlainTime → "HH:MM" for a native `<input type="time">` value. */
export function formatISOTime(t: Temporal.PlainTime | null | undefined): string {
  if (!t) return '';
  return t.toString({ smallestUnit: 'minute' });
}

/** Parse "HH:MM" → PlainTime. Returns null for invalid input. */
export function parseISOTime(s: string | null | undefined): Temporal.PlainTime | null {
  if (!s) return null;
  if (!/^\d{2}:\d{2}$/.test(s)) return null;
  try {
    return Temporal.PlainTime.from(s, { overflow: 'reject' });
  } catch {
    return null;
  }
}

export function clampDate(
  d: Temporal.PlainDate,
  min?: Temporal.PlainDate | null,
  max?: Temporal.PlainDate | null,
): Temporal.PlainDate {
  if (min && Temporal.PlainDate.compare(d, min) < 0) return min;
  if (max && Temporal.PlainDate.compare(d, max) > 0) return max;
  return d;
}

export function isDateDisabled(
  d: Temporal.PlainDate,
  options: {
    min?: Temporal.PlainDate | null;
    max?: Temporal.PlainDate | null;
    isDisabled?: (d: Temporal.PlainDate) => boolean;
  },
): boolean {
  const { min, max, isDisabled } = options;
  if (min && Temporal.PlainDate.compare(d, min) < 0) return true;
  if (max && Temporal.PlainDate.compare(d, max) > 0) return true;
  if (isDisabled?.(d)) return true;
  return false;
}

export function isInRange(
  d: Temporal.PlainDate,
  start: Temporal.PlainDate | null | undefined,
  end: Temporal.PlainDate | null | undefined,
): boolean {
  if (!start || !end) return false;
  const lo = Temporal.PlainDate.compare(start, end) <= 0 ? start : end;
  const hi = Temporal.PlainDate.compare(start, end) <= 0 ? end : start;
  return Temporal.PlainDate.compare(d, lo) >= 0 && Temporal.PlainDate.compare(d, hi) <= 0;
}
