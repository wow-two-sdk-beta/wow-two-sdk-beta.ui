import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addSeconds,
  addWeeks,
  addYears,
  clampDate,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInWeeks,
  differenceInYears,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  isAfter,
  isBefore,
  isBetween,
  isFuture,
  isPast,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isSameYear,
  isToday,
  isValidDate,
  isWithinInterval,
  maxDate,
  minDate,
  overlaps,
  parseIsoDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subSeconds,
  subWeeks,
  subYears,
  toIsoDateString,
} from '@src/foundation/datetime';

// Node project — every export is pure local-time `Date` math, no DOM.
//
// Timezone strategy: most assertions are zone-agnostic (they compare local fields against local fields,
// so they hold wherever this runs — CI, a GMT+5 laptop, a US reviewer's machine). The two behaviors that
// can ONLY be proven in a specific zone — local-day ISO serialization and DST wall-clock preservation —
// run inside `withTimeZone(...)` blocks that flip `process.env.TZ` (Node applies it to `Date` on the next
// call) and assert the switch actually took effect first, so a platform that ignored it fails loudly
// instead of silently passing a weaker test.

// `process.env` is typed as `{ NODE_ENV?: string }` in this project (no `@types/node` in the lib set),
// so reach it through a widened alias rather than augmenting the global type from a test file.
const processEnv = process.env as unknown as Record<string, string | undefined>;

/** Pins `process.env.TZ` for the enclosing describe block and restores it afterwards. */
function withTimeZone(timeZone: string): void {
  let original: string | undefined;
  beforeAll(() => {
    original = processEnv.TZ;
    processEnv.TZ = timeZone;
  });
  afterAll(() => {
    if (original === undefined) delete processEnv.TZ;
    else processEnv.TZ = original;
  });
}

const MS_HOUR = 3_600_000;

describe('arithmetic — calendar units', () => {
  it('adds and subtracts days, preserving time-of-day', () => {
    const base = new Date(2026, 2, 11, 14, 30, 15, 250);
    expect(toIsoDateString(addDays(base, 5))).toBe('2026-03-16');
    expect(toIsoDateString(subDays(base, 5))).toBe('2026-03-06');
    expect(addDays(base, 5).getHours()).toBe(14);
    expect(addDays(base, 5).getMilliseconds()).toBe(250);
  });

  it('rolls days across month and year boundaries', () => {
    expect(toIsoDateString(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
    expect(toIsoDateString(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
    expect(toIsoDateString(subDays(new Date(2026, 0, 1), 1))).toBe('2025-12-31');
  });

  it('adds and subtracts weeks as 7-day steps', () => {
    const base = new Date(2026, 2, 11);
    expect(toIsoDateString(addWeeks(base, 2))).toBe('2026-03-25');
    expect(toIsoDateString(subWeeks(base, 2))).toBe('2026-02-25');
  });

  it('CLAMPS addMonths to the target month length in a NON-leap year', () => {
    // The classic bug: naive `setMonth(+1)` on Jan 31 overflows to Mar 3.
    expect(toIsoDateString(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
    expect(toIsoDateString(addMonths(new Date(2026, 0, 31), 3))).toBe('2026-04-30');
    expect(toIsoDateString(addMonths(new Date(2026, 2, 31), -1))).toBe('2026-02-28');
  });

  it('CLAMPS addMonths to the target month length in a LEAP year', () => {
    expect(toIsoDateString(addMonths(new Date(2024, 0, 31), 1))).toBe('2024-02-29');
    expect(toIsoDateString(subMonths(new Date(2024, 2, 31), 1))).toBe('2024-02-29');
  });

  it('keeps time-of-day through a clamped addMonths', () => {
    const clamped = addMonths(new Date(2026, 0, 31, 23, 59, 58, 7), 1);
    expect(clamped.getHours()).toBe(23);
    expect(clamped.getSeconds()).toBe(58);
    expect(clamped.getMilliseconds()).toBe(7);
  });

  it('adds and subtracts months across a year boundary', () => {
    expect(toIsoDateString(addMonths(new Date(2026, 10, 15), 3))).toBe('2027-02-15');
    expect(toIsoDateString(subMonths(new Date(2026, 1, 15), 3))).toBe('2025-11-15');
  });

  it('clamps Feb 29 when adding or subtracting years into a non-leap year', () => {
    expect(toIsoDateString(addYears(new Date(2024, 1, 29), 1))).toBe('2025-02-28');
    expect(toIsoDateString(subYears(new Date(2024, 1, 29), 1))).toBe('2023-02-28');
    expect(toIsoDateString(addYears(new Date(2024, 1, 29), 4))).toBe('2028-02-29');
  });
});

describe('arithmetic — elapsed units', () => {
  const base = new Date(2026, 2, 11, 12, 0, 0, 0);

  it('adds and subtracts hours', () => {
    expect(addHours(base, 3).getHours()).toBe(15);
    expect(subHours(base, 3).getHours()).toBe(9);
    expect(addHours(base, 3).getTime() - base.getTime()).toBe(3 * MS_HOUR);
  });

  it('adds and subtracts minutes and seconds', () => {
    expect(addMinutes(base, 90).getTime() - base.getTime()).toBe(5_400_000);
    expect(subMinutes(base, 30).getMinutes()).toBe(30);
    expect(addSeconds(base, 45).getSeconds()).toBe(45);
    expect(subSeconds(base, 1).getTime() - base.getTime()).toBe(-1000);
  });

  it('rolls elapsed units over a day boundary', () => {
    expect(toIsoDateString(addHours(new Date(2026, 2, 11, 23, 0), 2))).toBe('2026-03-12');
  });
});

describe('boundaries', () => {
  const base = new Date(2026, 2, 11, 14, 30, 15, 250);

  it('snaps to start and end of day', () => {
    const start = startOfDay(base);
    expect([start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds()]).toEqual([
      0, 0, 0, 0,
    ]);

    const end = endOfDay(base);
    expect([end.getHours(), end.getMinutes(), end.getSeconds(), end.getMilliseconds()]).toEqual([
      23, 59, 59, 999,
    ]);
    expect(toIsoDateString(end)).toBe('2026-03-11');
  });

  it('snaps to start/end of week with the MONDAY default (ISO-8601)', () => {
    // 2026-03-11 is a Wednesday → Mon 2026-03-09 … Sun 2026-03-15.
    expect(toIsoDateString(startOfWeek(base))).toBe('2026-03-09');
    expect(toIsoDateString(endOfWeek(base))).toBe('2026-03-15');
    expect(startOfWeek(base).getHours()).toBe(0);
    expect(endOfWeek(base).getMilliseconds()).toBe(999);
  });

  it('snaps to start/end of week with a SUNDAY start (US)', () => {
    expect(toIsoDateString(startOfWeek(base, 0))).toBe('2026-03-08');
    expect(toIsoDateString(endOfWeek(base, 0))).toBe('2026-03-14');
  });

  it('treats a date that IS the week start as its own start', () => {
    const sunday = new Date(2026, 2, 15, 9, 0);
    expect(toIsoDateString(startOfWeek(sunday, 0))).toBe('2026-03-15');
    // Monday-start puts the same Sunday at the END of the previous week.
    expect(toIsoDateString(startOfWeek(sunday, 1))).toBe('2026-03-09');
  });

  it('honors every weekStartsOn value', () => {
    // Wednesday base: week start walks back to the most recent occurrence of each anchor day.
    const starts = ([0, 1, 2, 3, 4, 5, 6] as const).map((day) => toIsoDateString(startOfWeek(base, day)));
    expect(starts).toEqual([
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
      '2026-03-11',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
    ]);
  });

  it('snaps to start and end of month, including a 28/29/30-day month', () => {
    expect(toIsoDateString(startOfMonth(base))).toBe('2026-03-01');
    expect(toIsoDateString(endOfMonth(base))).toBe('2026-03-31');
    expect(toIsoDateString(endOfMonth(new Date(2026, 1, 10)))).toBe('2026-02-28');
    expect(toIsoDateString(endOfMonth(new Date(2024, 1, 10)))).toBe('2024-02-29');
    expect(toIsoDateString(endOfMonth(new Date(2026, 3, 10)))).toBe('2026-04-30');
    // Guards the `setMonth(+1)` overflow trap: end-of-month computed FROM a 31st.
    expect(toIsoDateString(endOfMonth(new Date(2026, 0, 31)))).toBe('2026-01-31');
    expect(endOfMonth(base).getHours()).toBe(23);
  });

  it('snaps to start and end of year', () => {
    expect(toIsoDateString(startOfYear(base))).toBe('2026-01-01');
    expect(toIsoDateString(endOfYear(base))).toBe('2026-12-31');
    expect(startOfYear(base).getMilliseconds()).toBe(0);
    expect(endOfYear(base).getMilliseconds()).toBe(999);
  });
});

describe('comparison — same-period', () => {
  it('compares same day ignoring time', () => {
    expect(isSameDay(new Date(2026, 2, 11, 0, 1), new Date(2026, 2, 11, 23, 59))).toBe(true);
    expect(isSameDay(new Date(2026, 2, 11, 23, 59), new Date(2026, 2, 12, 0, 0))).toBe(false);
    // Same day-of-month in a different month/year must not collide.
    expect(isSameDay(new Date(2026, 2, 11), new Date(2025, 2, 11))).toBe(false);
  });

  it('compares same week under both week starts', () => {
    const sunday = new Date(2026, 2, 15);
    const monday = new Date(2026, 2, 9);
    expect(isSameWeek(sunday, monday)).toBe(true); // Monday-start: Mar 9-15
    expect(isSameWeek(sunday, monday, 0)).toBe(false); // Sunday-start: Mar 15 opens a new week
  });

  it('spans the new year in the same ISO week', () => {
    const dec31 = new Date(2026, 11, 31); // Thursday
    const jan1 = new Date(2027, 0, 1); // Friday
    expect(isSameWeek(dec31, jan1)).toBe(true);
    expect(isSameYear(dec31, jan1)).toBe(false);
  });

  it('compares same month and same year', () => {
    expect(isSameMonth(new Date(2026, 2, 1), new Date(2026, 2, 31))).toBe(true);
    expect(isSameMonth(new Date(2026, 2, 1), new Date(2025, 2, 1))).toBe(false);
    expect(isSameYear(new Date(2026, 0, 1), new Date(2026, 11, 31))).toBe(true);
  });
});

describe('comparison — ordering', () => {
  const early = new Date(2026, 2, 11, 8, 0);
  const late = new Date(2026, 2, 11, 20, 0);

  it('orders strictly — an equal instant is neither before nor after', () => {
    expect(isBefore(early, late)).toBe(true);
    expect(isAfter(late, early)).toBe(true);
    expect(isBefore(early, new Date(early.getTime()))).toBe(false);
    expect(isAfter(early, new Date(early.getTime()))).toBe(false);
  });

  it('tests a range with inclusive bounds by default', () => {
    const start = new Date(2026, 2, 10);
    const end = new Date(2026, 2, 20);
    expect(isBetween(new Date(2026, 2, 15), start, end)).toBe(true);
    expect(isBetween(start, start, end)).toBe(true);
    expect(isBetween(end, start, end)).toBe(true);
    expect(isBetween(new Date(2026, 2, 21), start, end)).toBe(false);
  });

  it('excludes bounds on request', () => {
    const start = new Date(2026, 2, 10);
    const end = new Date(2026, 2, 20);
    expect(isBetween(start, start, end, { inclusive: false })).toBe(false);
    expect(isBetween(end, start, end, { inclusive: false })).toBe(false);
    expect(isBetween(new Date(2026, 2, 15), start, end, { inclusive: false })).toBe(true);
  });

  it('treats a REVERSED range as empty rather than swapping the bounds', () => {
    expect(isBetween(new Date(2026, 2, 15), new Date(2026, 2, 20), new Date(2026, 2, 10))).toBe(false);
  });
});

describe('comparison — now-dependent (injected clock)', () => {
  const now = new Date(2026, 2, 11, 12, 0, 0);

  it('isToday compares against the INJECTED now', () => {
    expect(isToday(new Date(2026, 2, 11, 0, 0), now)).toBe(true);
    expect(isToday(new Date(2026, 2, 11, 23, 59, 59, 999), now)).toBe(true);
    expect(isToday(new Date(2026, 2, 12, 0, 0), now)).toBe(false);
    expect(isToday(new Date(2026, 2, 10, 23, 59), now)).toBe(false);
  });

  it('isPast / isFuture compare against the INJECTED now, exclusive of now itself', () => {
    expect(isPast(new Date(2026, 2, 11, 11, 59, 59, 999), now)).toBe(true);
    expect(isPast(new Date(2026, 2, 11, 12, 0, 0), now)).toBe(false);
    expect(isFuture(new Date(2026, 2, 11, 12, 0, 0, 1), now)).toBe(true);
    expect(isFuture(new Date(2026, 2, 11, 12, 0, 0), now)).toBe(false);
    // Same day, still past/future — these are instant comparisons, not day comparisons.
    expect(isToday(new Date(2026, 2, 11, 8, 0), now) && isPast(new Date(2026, 2, 11, 8, 0), now)).toBe(true);
  });

  it('falls back to the real clock when now is omitted', () => {
    expect(isToday(new Date())).toBe(true);
    expect(isPast(new Date(2000, 0, 1))).toBe(true);
    expect(isFuture(new Date(2100, 0, 1))).toBe(true);
  });
});

describe('comparison — selection', () => {
  const a = new Date(2026, 2, 11);
  const b = new Date(2026, 2, 15);
  const c = new Date(2026, 1, 1);

  it('picks the earliest and latest of N dates', () => {
    expect(toIsoDateString(minDate(a, b, c))).toBe('2026-02-01');
    expect(toIsoDateString(maxDate(a, b, c))).toBe('2026-03-15');
    expect(toIsoDateString(minDate(a))).toBe('2026-03-11');
  });

  it('returns a COPY, never one of the inputs', () => {
    const picked = minDate(a, b);
    expect(picked).not.toBe(a);
    expect(picked.getTime()).toBe(a.getTime());
  });

  it('ignores invalid dates unless every input is invalid', () => {
    const invalid = new Date('nope');
    expect(toIsoDateString(minDate(invalid, b, c))).toBe('2026-02-01');
    expect(toIsoDateString(maxDate(invalid, c))).toBe('2026-02-01');
    expect(isValidDate(minDate(invalid))).toBe(false);
  });

  it('clamps into a range, leaving an in-range date alone', () => {
    expect(toIsoDateString(clampDate(new Date(2026, 2, 1), a, b))).toBe('2026-03-11');
    expect(toIsoDateString(clampDate(new Date(2026, 2, 20), a, b))).toBe('2026-03-15');
    expect(toIsoDateString(clampDate(new Date(2026, 2, 13), a, b))).toBe('2026-03-13');
  });

  it('treats an omitted or null bound as an open side', () => {
    expect(toIsoDateString(clampDate(new Date(2026, 0, 1), null, b))).toBe('2026-01-01');
    expect(toIsoDateString(clampDate(new Date(2026, 5, 1), a))).toBe('2026-06-01');
    expect(toIsoDateString(clampDate(new Date(2026, 0, 1), a, null))).toBe('2026-03-11');
  });

  it('resolves an inverted min/max pair to max (documented low-then-high order)', () => {
    expect(toIsoDateString(clampDate(new Date(2026, 2, 13), b, a))).toBe('2026-03-11');
  });
});

describe('differences', () => {
  it('counts elapsed units truncated toward zero', () => {
    const from = new Date(2026, 2, 11, 10, 0, 0);
    expect(differenceInSeconds(from, new Date(2026, 2, 11, 10, 0, 59, 999))).toBe(59);
    expect(differenceInMinutes(from, new Date(2026, 2, 11, 11, 59, 59))).toBe(119);
    expect(differenceInHours(from, new Date(2026, 2, 11, 15, 59))).toBe(5);
  });

  it('is signed on (from, to) order and symmetric under swap', () => {
    const from = new Date(2026, 2, 11, 10, 0);
    const to = new Date(2026, 2, 11, 15, 0);
    expect(differenceInHours(from, to)).toBe(5);
    expect(differenceInHours(to, from)).toBe(-5);
    expect(differenceInMinutes(to, from)).toBe(-300);
  });

  it('counts CALENDAR days — a boundary crossed counts, hours elapsed do not', () => {
    // 2 hours apart but a date boundary between them → 1 day.
    expect(differenceInDays(new Date(2026, 2, 11, 23, 0), new Date(2026, 2, 12, 1, 0))).toBe(1);
    // 23 hours apart inside one day → 0 days.
    expect(differenceInDays(new Date(2026, 2, 11, 0, 30), new Date(2026, 2, 11, 23, 30))).toBe(0);
    expect(differenceInDays(new Date(2026, 2, 1), new Date(2026, 2, 31))).toBe(30);
    expect(differenceInDays(new Date(2026, 2, 31), new Date(2026, 2, 1))).toBe(-30);
  });

  it('counts whole weeks from calendar days', () => {
    expect(differenceInWeeks(new Date(2026, 2, 1), new Date(2026, 2, 14))).toBe(1); // 13 days
    expect(differenceInWeeks(new Date(2026, 2, 1), new Date(2026, 2, 15))).toBe(2); // 14 days
    expect(differenceInWeeks(new Date(2026, 2, 15), new Date(2026, 2, 1))).toBe(-2);
  });

  it('counts whole calendar months, dropping a partial trailing month', () => {
    expect(differenceInMonths(new Date(2026, 0, 15), new Date(2026, 1, 14))).toBe(0);
    expect(differenceInMonths(new Date(2026, 0, 15), new Date(2026, 1, 15))).toBe(1);
    expect(differenceInMonths(new Date(2026, 0, 15), new Date(2027, 0, 15))).toBe(12);
    expect(differenceInMonths(new Date(2027, 0, 15), new Date(2026, 0, 15))).toBe(-12);
    expect(differenceInMonths(new Date(2026, 0, 15), new Date(2025, 11, 20))).toBe(0);
  });

  it('agrees with addMonths clamping at a month-end edge', () => {
    // addMonths(Jan 31, 1) === Feb 28, so Jan 31 → Feb 28 is a FULL month.
    expect(differenceInMonths(new Date(2026, 0, 31), new Date(2026, 1, 28))).toBe(1);
    expect(differenceInMonths(new Date(2026, 0, 31), new Date(2026, 1, 27))).toBe(0);
  });

  it('counts whole years, truncating a partial year', () => {
    expect(differenceInYears(new Date(2000, 5, 15), new Date(2026, 5, 15))).toBe(26);
    expect(differenceInYears(new Date(2000, 5, 15), new Date(2026, 5, 14))).toBe(25);
    expect(differenceInYears(new Date(2026, 5, 15), new Date(2000, 5, 15))).toBe(-26);
  });
});

describe('invalid-date contract', () => {
  const invalid = new Date('nope');
  const valid = new Date(2026, 2, 11);

  it('makes every predicate false rather than throwing', () => {
    expect(isSameDay(invalid, valid)).toBe(false);
    expect(isSameWeek(invalid, valid)).toBe(false);
    expect(isSameMonth(invalid, valid)).toBe(false);
    expect(isSameYear(invalid, valid)).toBe(false);
    expect(isBefore(invalid, valid)).toBe(false);
    expect(isAfter(invalid, valid)).toBe(false);
    expect(isBetween(invalid, valid, valid)).toBe(false);
    expect(isToday(invalid, valid)).toBe(false);
    expect(isPast(invalid, valid)).toBe(false);
    expect(isFuture(invalid, valid)).toBe(false);
    expect(isWithinInterval(invalid, { start: valid, end: valid })).toBe(false);
  });

  it('makes every difference NaN', () => {
    expect(differenceInSeconds(invalid, valid)).toBeNaN();
    expect(differenceInMinutes(invalid, valid)).toBeNaN();
    expect(differenceInHours(invalid, valid)).toBeNaN();
    expect(differenceInDays(invalid, valid)).toBeNaN();
    expect(differenceInWeeks(invalid, valid)).toBeNaN();
    expect(differenceInMonths(invalid, valid)).toBeNaN();
    expect(differenceInYears(invalid, valid)).toBeNaN();
  });

  it('propagates invalidity through arithmetic and boundaries instead of inventing a date', () => {
    expect(isValidDate(addDays(invalid, 1))).toBe(false);
    expect(isValidDate(addMonths(invalid, 1))).toBe(false);
    expect(isValidDate(addHours(invalid, 1))).toBe(false);
    expect(isValidDate(startOfDay(invalid))).toBe(false);
    expect(isValidDate(startOfWeek(invalid))).toBe(false);
    expect(isValidDate(endOfMonth(invalid))).toBe(false);
  });
});

describe('ranges', () => {
  it('walks every day of an interval with BOTH bounds inclusive', () => {
    const days = eachDayOfInterval(new Date(2026, 2, 11, 18, 0), new Date(2026, 2, 14, 3, 0));
    expect(days.map((day) => toIsoDateString(day))).toEqual([
      '2026-03-11',
      '2026-03-12',
      '2026-03-13',
      '2026-03-14',
    ]);
    // Each entry is snapped to local start-of-day, not to the caller's time-of-day.
    expect(days.every((day) => day.getHours() === 0 && day.getMilliseconds() === 0)).toBe(true);
  });

  it('returns a single day when both bounds are the same day', () => {
    expect(eachDayOfInterval(new Date(2026, 2, 11, 1, 0), new Date(2026, 2, 11, 23, 0))).toHaveLength(1);
  });

  it('returns [] for a REVERSED range rather than walking backwards', () => {
    expect(eachDayOfInterval(new Date(2026, 2, 14), new Date(2026, 2, 11))).toEqual([]);
  });

  it('returns [] for an invalid bound instead of looping forever', () => {
    expect(eachDayOfInterval(new Date('nope'), new Date(2026, 2, 11))).toEqual([]);
    expect(eachDayOfInterval(new Date(2026, 2, 11), new Date('nope'))).toEqual([]);
  });

  it('crosses a month boundary', () => {
    const days = eachDayOfInterval(new Date(2026, 1, 27), new Date(2026, 2, 2));
    expect(days.map((day) => toIsoDateString(day))).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
  });

  it('tests point membership with INCLUSIVE bounds', () => {
    const interval = { start: new Date(2026, 2, 10), end: new Date(2026, 2, 20) };
    expect(isWithinInterval(new Date(2026, 2, 15), interval)).toBe(true);
    expect(isWithinInterval(interval.start, interval)).toBe(true);
    expect(isWithinInterval(interval.end, interval)).toBe(true);
    expect(isWithinInterval(new Date(2026, 2, 9), interval)).toBe(false);
    expect(isWithinInterval(new Date(2026, 2, 15), { start: interval.end, end: interval.start })).toBe(false);
  });

  it('overlaps HALF-OPEN by default — back-to-back ranges do not conflict', () => {
    const morning = { start: new Date(2026, 2, 11, 9, 0), end: new Date(2026, 2, 11, 10, 0) };
    const midday = { start: new Date(2026, 2, 11, 10, 0), end: new Date(2026, 2, 11, 11, 0) };
    expect(overlaps(morning, midday)).toBe(false);
    expect(overlaps(midday, morning)).toBe(false);
    expect(overlaps(morning, midday, { inclusive: true })).toBe(true);
  });

  it('detects partial, contained, and identical overlaps', () => {
    const base = { start: new Date(2026, 2, 11, 9, 0), end: new Date(2026, 2, 11, 12, 0) };
    expect(overlaps(base, { start: new Date(2026, 2, 11, 11, 0), end: new Date(2026, 2, 11, 14, 0) })).toBe(true);
    expect(overlaps(base, { start: new Date(2026, 2, 11, 10, 0), end: new Date(2026, 2, 11, 11, 0) })).toBe(true);
    expect(overlaps(base, base)).toBe(true);
    expect(overlaps(base, { start: new Date(2026, 2, 11, 13, 0), end: new Date(2026, 2, 11, 14, 0) })).toBe(false);
  });

  it('returns false for a reversed or invalid range', () => {
    const good = { start: new Date(2026, 2, 11, 9, 0), end: new Date(2026, 2, 11, 12, 0) };
    expect(overlaps(good, { start: new Date(2026, 2, 11, 12, 0), end: new Date(2026, 2, 11, 9, 0) })).toBe(false);
    expect(overlaps(good, { start: new Date('nope'), end: new Date(2026, 2, 11, 10, 0) })).toBe(false);
  });

  it('never overlaps a zero-length range unless inclusive', () => {
    const instant = { start: new Date(2026, 2, 11, 10, 0), end: new Date(2026, 2, 11, 10, 0) };
    const window = { start: new Date(2026, 2, 11, 9, 0), end: new Date(2026, 2, 11, 12, 0) };
    expect(overlaps(instant, window)).toBe(false);
    expect(overlaps(window, instant)).toBe(false);
    expect(overlaps(instant, window, { inclusive: true })).toBe(true);
    // Consistent wherever the degenerate range sits — on a boundary or strictly inside.
    const onBoundary = { start: window.start, end: window.start };
    expect(overlaps(onBoundary, window)).toBe(false);
    expect(overlaps(onBoundary, window, { inclusive: true })).toBe(true);
    // A degenerate range outside the window stays false in both modes.
    const outside = { start: new Date(2026, 2, 11, 13, 0), end: new Date(2026, 2, 11, 13, 0) };
    expect(overlaps(outside, window, { inclusive: true })).toBe(false);
  });
});

describe('validity guard', () => {
  it('accepts only a real, non-NaN Date', () => {
    expect(isValidDate(new Date(2026, 2, 11))).toBe(true);
    expect(isValidDate(new Date('nope'))).toBe(false);
    expect(isValidDate(new Date(NaN))).toBe(false);
  });

  it('rejects every non-Date value', () => {
    expect(isValidDate('2026-03-11')).toBe(false);
    expect(isValidDate(1_772_000_000_000)).toBe(false);
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
    expect(isValidDate({})).toBe(false);
  });
});

describe('parsing', () => {
  it('parses a date-only string to LOCAL midnight', () => {
    const parsed = parseIsoDate('2026-03-15');
    expect(parsed).not.toBeNull();
    expect(toIsoDateString(parsed as Date)).toBe('2026-03-15');
    expect((parsed as Date).getHours()).toBe(0);
    expect((parsed as Date).getDate()).toBe(15);
  });

  it('parses a date-time with an explicit offset as that absolute instant', () => {
    const parsed = parseIsoDate('2026-03-15T10:30:00Z');
    expect(parsed?.getTime()).toBe(Date.UTC(2026, 2, 15, 10, 30));
    expect(parseIsoDate('2026-03-15T10:30:00+02:00')?.getTime()).toBe(Date.UTC(2026, 2, 15, 8, 30));
  });

  it('parses an offset-less date-time as local wall-clock', () => {
    const parsed = parseIsoDate('2026-03-15T10:30');
    expect(parsed?.getHours()).toBe(10);
    expect(parsed?.getMinutes()).toBe(30);
    expect(parseIsoDate('2026-03-15T10:30:45.123')?.getMilliseconds()).toBe(123);
  });

  it('returns NULL for garbage rather than an Invalid Date', () => {
    for (const garbage of ['', '   ', 'nope', 'March 5 2026', '15/03/2026', '2026-3-5', '2026', 'T10:30']) {
      expect(parseIsoDate(garbage)).toBeNull();
    }
  });

  it('returns NULL for a well-shaped but impossible date', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('2026-00-10')).toBeNull();
    expect(parseIsoDate('2025-02-29')).toBeNull();
    expect(parseIsoDate('2026-03-15T25:00:00Z')).toBeNull();
  });

  it('accepts Feb 29 in a leap year only', () => {
    expect(parseIsoDate('2024-02-29')).not.toBeNull();
    expect(parseIsoDate('2026-02-29')).toBeNull();
  });

  it('rejects a space separator, matching the http temporalReviver shapes', () => {
    expect(parseIsoDate('2026-03-15 10:30')).toBeNull();
  });

  it('tolerates surrounding whitespace', () => {
    expect(toIsoDateString(parseIsoDate('  2026-03-15  ') as Date)).toBe('2026-03-15');
  });

  it('round-trips through toIsoDateString', () => {
    for (const iso of ['2026-03-15', '2024-02-29', '2026-01-01', '2026-12-31']) {
      expect(toIsoDateString(parseIsoDate(iso) as Date)).toBe(iso);
    }
  });
});

describe('serialization', () => {
  it('pads month and day', () => {
    expect(toIsoDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toIsoDateString(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('throws on an invalid Date instead of emitting NaN-NaN-NaN', () => {
    expect(() => toIsoDateString(new Date('nope'))).toThrow(RangeError);
  });

  it('throws on a year outside 0000-9999', () => {
    const farFuture = new Date(2026, 0, 1);
    farFuture.setFullYear(10_000);
    expect(() => toIsoDateString(farFuture)).toThrow(RangeError);
  });
});

describe('local-day serialization in a NEGATIVE-offset zone', () => {
  withTimeZone('America/New_York');

  it('runs in the pinned zone', () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(300);
  });

  it('keeps the LOCAL day on a late-evening date where toISOString() rolls forward', () => {
    const lateEvening = new Date(2026, 2, 15, 23, 30);
    expect(lateEvening.toISOString().slice(0, 10)).toBe('2026-03-16'); // the bug being avoided
    expect(toIsoDateString(lateEvening)).toBe('2026-03-15'); // what the user sees on the clock
  });

  it('parses a date-only string to LOCAL midnight, not UTC midnight', () => {
    const parsed = parseIsoDate('2026-03-15');
    expect(parsed?.getDate()).toBe(15);
    expect(parsed?.getHours()).toBe(0);
    // `new Date('2026-03-15')` is UTC midnight → the previous evening locally.
    expect(new Date('2026-03-15').getDate()).toBe(14);
  });
});

describe('local-day serialization in a POSITIVE-offset zone', () => {
  withTimeZone('Asia/Tokyo');

  it('runs in the pinned zone', () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(-540);
  });

  it('keeps the LOCAL day on an early-morning date where toISOString() rolls backward', () => {
    const earlyMorning = new Date(2026, 2, 15, 0, 30);
    expect(earlyMorning.toISOString().slice(0, 10)).toBe('2026-03-14'); // the bug being avoided
    expect(toIsoDateString(earlyMorning)).toBe('2026-03-15');
  });
});

describe('DST — America/New_York', () => {
  withTimeZone('America/New_York');

  it('observes DST in the pinned zone (guard: the rest of this block is meaningless otherwise)', () => {
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(300); // EST
    expect(new Date(2026, 6, 1).getTimezoneOffset()).toBe(240); // EDT
  });

  it('addDays keeps WALL-CLOCK time across spring-forward (a 23-hour day)', () => {
    const beforeGap = new Date(2026, 2, 7, 9, 0); // Sat before the Mar 8 transition
    const next = addDays(beforeGap, 1);
    expect(toIsoDateString(next)).toBe('2026-03-08');
    expect(next.getHours()).toBe(9);
    expect(next.getTime() - beforeGap.getTime()).toBe(23 * MS_HOUR); // only 23h really elapsed
  });

  it('addDays keeps WALL-CLOCK time across fall-back (a 25-hour day)', () => {
    const beforeShift = new Date(2026, 9, 31, 9, 0); // Sat before the Nov 1 transition
    const next = addDays(beforeShift, 1);
    expect(next.getHours()).toBe(9);
    expect(next.getTime() - beforeShift.getTime()).toBe(25 * MS_HOUR);
  });

  it('addHours adds ELAPSED time, so wall-clock jumps across the spring-forward gap', () => {
    const beforeGap = new Date(2026, 2, 8, 0, 30); // 00:30 EST, 90 min before the 02:00 gap
    const later = addHours(beforeGap, 2);
    expect(later.getTime() - beforeGap.getTime()).toBe(2 * MS_HOUR);
    expect(later.getHours()).toBe(3); // 02:30 does not exist → 03:30 EDT
  });

  it('differenceInDays counts 1 across a 23-hour DST day', () => {
    expect(differenceInDays(new Date(2026, 2, 7, 9, 0), new Date(2026, 2, 8, 9, 0))).toBe(1);
    expect(differenceInHours(new Date(2026, 2, 7, 9, 0), new Date(2026, 2, 8, 9, 0))).toBe(23);
  });

  it('eachDayOfInterval emits one entry per calendar day across the transition', () => {
    const days = eachDayOfInterval(new Date(2026, 2, 6), new Date(2026, 2, 10));
    expect(days.map((day) => toIsoDateString(day))).toEqual([
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
    ]);
  });

  it('startOfWeek and addMonths survive the transition week', () => {
    expect(toIsoDateString(startOfWeek(new Date(2026, 2, 8, 12, 0)))).toBe('2026-03-02');
    expect(toIsoDateString(addMonths(new Date(2026, 1, 8, 12, 0), 1))).toBe('2026-03-08');
    expect(addMonths(new Date(2026, 1, 8, 12, 0), 1).getHours()).toBe(12);
  });
});

describe('immutability — no operation mutates its input', () => {
  // One table over every op that takes a Date, so a newly added op that mutates gets caught here
  // rather than in whichever consumer notices its picker jumping a month.
  const operations: readonly [string, (input: Date) => unknown][] = [
    ['addDays', (d) => addDays(d, 3)],
    ['subDays', (d) => subDays(d, 3)],
    ['addWeeks', (d) => addWeeks(d, 3)],
    ['subWeeks', (d) => subWeeks(d, 3)],
    ['addMonths', (d) => addMonths(d, 3)],
    ['subMonths', (d) => subMonths(d, 3)],
    ['addYears', (d) => addYears(d, 3)],
    ['subYears', (d) => subYears(d, 3)],
    ['addHours', (d) => addHours(d, 3)],
    ['subHours', (d) => subHours(d, 3)],
    ['addMinutes', (d) => addMinutes(d, 3)],
    ['subMinutes', (d) => subMinutes(d, 3)],
    ['addSeconds', (d) => addSeconds(d, 3)],
    ['subSeconds', (d) => subSeconds(d, 3)],
    ['startOfDay', (d) => startOfDay(d)],
    ['endOfDay', (d) => endOfDay(d)],
    ['startOfWeek', (d) => startOfWeek(d)],
    ['endOfWeek', (d) => endOfWeek(d)],
    ['startOfMonth', (d) => startOfMonth(d)],
    ['endOfMonth', (d) => endOfMonth(d)],
    ['startOfYear', (d) => startOfYear(d)],
    ['endOfYear', (d) => endOfYear(d)],
    ['isSameDay', (d) => isSameDay(d, new Date(2020, 0, 1))],
    ['isSameWeek', (d) => isSameWeek(d, new Date(2020, 0, 1))],
    ['isSameMonth', (d) => isSameMonth(d, new Date(2020, 0, 1))],
    ['isSameYear', (d) => isSameYear(d, new Date(2020, 0, 1))],
    ['isBefore', (d) => isBefore(d, new Date(2020, 0, 1))],
    ['isAfter', (d) => isAfter(d, new Date(2020, 0, 1))],
    ['isBetween', (d) => isBetween(d, new Date(2020, 0, 1), new Date(2030, 0, 1))],
    ['isToday', (d) => isToday(d, new Date(2026, 2, 11))],
    ['isPast', (d) => isPast(d, new Date(2026, 2, 11))],
    ['isFuture', (d) => isFuture(d, new Date(2026, 2, 11))],
    ['minDate', (d) => minDate(d, new Date(2020, 0, 1))],
    ['maxDate', (d) => maxDate(d, new Date(2020, 0, 1))],
    ['clampDate', (d) => clampDate(d, new Date(2020, 0, 1), new Date(2030, 0, 1))],
    ['differenceInSeconds', (d) => differenceInSeconds(d, new Date(2020, 0, 1))],
    ['differenceInMinutes', (d) => differenceInMinutes(d, new Date(2020, 0, 1))],
    ['differenceInHours', (d) => differenceInHours(d, new Date(2020, 0, 1))],
    ['differenceInDays', (d) => differenceInDays(d, new Date(2020, 0, 1))],
    ['differenceInWeeks', (d) => differenceInWeeks(d, new Date(2020, 0, 1))],
    ['differenceInMonths', (d) => differenceInMonths(d, new Date(2020, 0, 1))],
    ['differenceInYears', (d) => differenceInYears(d, new Date(2020, 0, 1))],
    ['eachDayOfInterval', (d) => eachDayOfInterval(d, addDays(d, 2))],
    ['isWithinInterval', (d) => isWithinInterval(d, { start: new Date(2020, 0, 1), end: new Date(2030, 0, 1) })],
    ['overlaps', (d) => overlaps({ start: d, end: addDays(d, 1) }, { start: d, end: addDays(d, 2) })],
    ['isValidDate', (d) => isValidDate(d)],
    ['toIsoDateString', (d) => toIsoDateString(d)],
  ];

  it.each(operations)('%s leaves its input untouched', (_name, operate) => {
    const input = new Date(2026, 0, 31, 14, 30, 15, 250);
    const snapshot = input.getTime();
    operate(input);
    expect(input.getTime()).toBe(snapshot);
    expect(toIsoDateString(input)).toBe('2026-01-31');
  });

  it('returns a NEW Date, never the same reference', () => {
    const input = new Date(2026, 2, 11, 12, 0);
    const producers: readonly ((value: Date) => Date)[] = [
      (d) => addDays(d, 0),
      (d) => addMonths(d, 0),
      (d) => addHours(d, 0),
      (d) => startOfDay(d),
      (d) => endOfDay(d),
      (d) => startOfWeek(d),
      (d) => startOfMonth(d),
      (d) => startOfYear(d),
      (d) => minDate(d),
      (d) => maxDate(d),
      (d) => clampDate(d),
    ];
    for (const produce of producers) {
      expect(produce(input)).not.toBe(input);
    }
  });

  it('does not alias the bound it clamps to', () => {
    const min = new Date(2026, 2, 11);
    const clamped = clampDate(new Date(2026, 0, 1), min);
    expect(clamped).not.toBe(min);
    clamped.setFullYear(2030);
    expect(min.getFullYear()).toBe(2026);
  });

  it('does not alias entries returned from eachDayOfInterval', () => {
    const days = eachDayOfInterval(new Date(2026, 2, 11), new Date(2026, 2, 13));
    const [first] = days;
    first?.setFullYear(2030);
    expect(days.map((day) => day.getFullYear())).toEqual([2030, 2026, 2026]);
  });
});
