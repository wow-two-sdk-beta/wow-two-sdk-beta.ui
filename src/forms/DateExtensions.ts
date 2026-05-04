// Shared date helpers for Calendar / DatePicker / DateField / RangeCalendar.
// Co-located in `forms/` so imports stay within-domain.
//
// Native Date only — no date-fns / luxon dependency. All helpers operate on
// local time (no UTC math) since calendar UIs are inherently local.

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

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function addMonths(d: Date, n: number): Date {
  const c = new Date(d);
  c.setMonth(c.getMonth() + n);
  return c;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function daysInMonth(year: number, month: number): number {
  // month is 0-indexed; setting day 0 of next month gives last day of month.
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Build the 6-week (42-cell) grid that the calendar UI renders.
 * Cells outside the target month carry `outOfMonth: true`.
 */
export function buildMonthGrid(year: number, month: number): { date: Date; outOfMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay(); // 0 (Sun) – 6 (Sat)
  const start = addDays(first, -firstWeekday);
  const cells: { date: Date; outOfMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(start, i);
    cells.push({ date, outOfMonth: date.getMonth() !== month });
  }
  return cells;
}

/** Format Date → "YYYY-MM-DD" for native `<input type="date">` value. */
export function formatISODate(d: Date | null | undefined): string {
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse "YYYY-MM-DD" → Date (local time). Returns null for invalid input. */
export function parseISODate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [, y, mo, d] = m;
  if (!y || !mo || !d) return null;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (isNaN(date.getTime())) return null;
  return date;
}

/** Format Date → "HH:MM" for native `<input type="time">` value. */
export function formatISOTime(d: Date | null | undefined): string {
  if (!d) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Parse "HH:MM" → { hours, minutes }. Returns null for invalid input. */
export function parseISOTime(s: string | null | undefined): { hours: number; minutes: number } | null {
  if (!s) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const [, h, mi] = m;
  if (!h || !mi) return null;
  const hours = Number(h);
  const minutes = Number(mi);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function clampDate(d: Date, min?: Date | null, max?: Date | null): Date {
  if (min && d < min) return min;
  if (max && d > max) return max;
  return d;
}

export function isDateDisabled(
  d: Date,
  options: { min?: Date | null; max?: Date | null; isDisabled?: (d: Date) => boolean },
): boolean {
  const { min, max, isDisabled } = options;
  if (min && startOfDay(d) < startOfDay(min)) return true;
  if (max && startOfDay(d) > startOfDay(max)) return true;
  if (isDisabled?.(d)) return true;
  return false;
}

export function isInRange(
  d: Date,
  start: Date | null | undefined,
  end: Date | null | undefined,
): boolean {
  if (!start || !end) return false;
  const t = startOfDay(d).getTime();
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  return t >= Math.min(s, e) && t <= Math.max(s, e);
}
