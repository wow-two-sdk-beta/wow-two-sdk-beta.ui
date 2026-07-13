/* ---------------------------------------------------------------------------
 * temporalReviver / parseJson tests.
 *
 * Contract: only strings that unambiguously match one strict, anchored
 * ISO-8601 shape are upgraded to the corresponding `Temporal.*` value.
 * ISO-shaped but semantically invalid values (e.g. month 13) fall back to
 * the raw string instead of throwing; everything else passes through.
 * ------------------------------------------------------------------------- */

import { Temporal } from 'temporal-polyfill';
import { describe, expect, it } from 'vitest';

import { parseJson, temporalReviver } from '@src/foundation/http/temporalReviver';

const revive = (value: unknown): unknown => temporalReviver('key', value);

describe('temporalReviver — non-strings pass through', () => {
  it.each<[desc: string, value: unknown]>([
    ['number', 42],
    ['boolean', true],
    ['null', null],
  ])('%s is returned unchanged', (_desc, value) => {
    expect(revive(value)).toBe(value);
  });

  it('objects and arrays keep their reference', () => {
    const obj = { at: '2026-07-04T12:00:00Z' };
    const arr = ['2026-07-04'];
    expect(revive(obj)).toBe(obj);
    expect(revive(arr)).toBe(arr);
  });
});

describe('temporalReviver — instants', () => {
  it.each([
    ['2026-07-04T12:00:00Z'],
    ['2026-07-04T12:00Z'], // seconds optional
    ['2026-07-04T12:00:00.123Z'], // fractional seconds
    ['2026-07-04T12:00:00+05:00'], // numeric offset
  ])('upgrades %s to Temporal.Instant', (value) => {
    const result = revive(value);
    expect(result).toBeInstanceOf(Temporal.Instant);
    expect((result as Temporal.Instant).epochMilliseconds).toBe(new Date(value).getTime());
  });

  it('normalizes an offset instant to UTC', () => {
    expect(String(revive('2026-07-04T12:00:00+05:00'))).toBe('2026-07-04T07:00:00Z');
  });
});

describe('temporalReviver — plain dates', () => {
  it('upgrades YYYY-MM-DD to Temporal.PlainDate', () => {
    const result = revive('2026-07-04');
    expect(result).toBeInstanceOf(Temporal.PlainDate);
    const date = result as Temporal.PlainDate;
    expect([date.year, date.month, date.day]).toEqual([2026, 7, 4]);
  });
});

describe('temporalReviver — plain times', () => {
  it.each<[value: string, hour: number, minute: number, second: number, millisecond: number]>([
    ['09:30', 9, 30, 0, 0],
    ['23:59:59', 23, 59, 59, 0],
    ['12:30:45.5', 12, 30, 45, 500],
  ])('upgrades %s to Temporal.PlainTime', (value, hour, minute, second, millisecond) => {
    const result = revive(value);
    expect(result).toBeInstanceOf(Temporal.PlainTime);
    const time = result as Temporal.PlainTime;
    expect([time.hour, time.minute, time.second, time.millisecond]).toEqual([
      hour,
      minute,
      second,
      millisecond,
    ]);
  });
});

describe('temporalReviver — durations', () => {
  it.each([
    ['P1Y2M3DT4H5M6S'],
    ['P3W'],
    ['PT30S'],
    ['PT1.5S'], // fractional seconds
    ['-P1D'], // leading sign
  ])('upgrades %s to Temporal.Duration (round-trips via toString)', (value) => {
    const result = revive(value);
    expect(result).toBeInstanceOf(Temporal.Duration);
    expect(String(result)).toBe(value);
  });

  it('parses fields and sign (fields carry the sign)', () => {
    const duration = revive('-P1D') as Temporal.Duration;
    expect(duration.days).toBe(-1);
    expect(duration.sign).toBe(-1);
  });
});

describe('temporalReviver — non-matching strings stay strings', () => {
  it.each([
    ['zoneless date-time (ambiguous)', '2026-07-04T12:00:00'],
    ['non-padded date', '2026-7-4'],
    ['compact date', '20260704'],
    ['space-separated date-time', '2026-07-04 12:00:00Z'],
    ['hour-only instant', '2026-07-04T12Z'],
    ['single-digit minute time', '12:3'],
    ['bare P duration (lookahead rejects)', 'P'],
    ['fractional days (not in grammar)', 'P1.5D'],
    ['date embedded in prose (anchored)', 'due 2026-07-04'],
    ['plain word', 'hello'],
    ['empty string', ''],
    ['digits only', '1234'],
  ])('%s: %j', (_desc, value) => {
    expect(revive(value)).toBe(value);
  });
});

describe('temporalReviver — ISO-shaped but invalid values fall back to the raw string', () => {
  it.each([
    ['month/day out of range', '2026-13-40'],
    ['instant with month 13', '2026-13-40T12:00:00Z'],
    ['hour 99', '99:99'],
    ['duration with empty time designator', 'PT'],
  ])('%s: %j', (_desc, value) => {
    expect(revive(value)).toBe(value);
  });
});

describe('parseJson', () => {
  it('upgrades matching fields at any depth and leaves the rest untouched', () => {
    interface Parsed {
      meta: { count: number; active: boolean; label: string };
      createdAt: Temporal.Instant;
      dueDate: Temporal.PlainDate;
      opensAt: Temporal.PlainTime;
      retryEvery: Temporal.Duration;
      tags: ReadonlyArray<Temporal.PlainDate | string>;
    }

    const parsed = parseJson<Parsed>(
      JSON.stringify({
        meta: { count: 3, active: true, label: 'orders' },
        createdAt: '2026-07-04T12:00:00Z',
        dueDate: '2026-08-01',
        opensAt: '09:30',
        retryEvery: 'PT30S',
        tags: ['2026-01-01', 'not-a-date'],
      }),
    );

    expect(parsed.createdAt).toBeInstanceOf(Temporal.Instant);
    expect(parsed.dueDate).toBeInstanceOf(Temporal.PlainDate);
    expect(parsed.opensAt).toBeInstanceOf(Temporal.PlainTime);
    expect(parsed.retryEvery).toBeInstanceOf(Temporal.Duration);
    expect(parsed.meta).toEqual({ count: 3, active: true, label: 'orders' });

    const [first, second] = parsed.tags;
    expect(first).toBeInstanceOf(Temporal.PlainDate);
    expect(second).toBe('not-a-date');
  });

  it('round-trips: Temporal toJSON output is revived back to the same value', () => {
    const instant = Temporal.Instant.from('2026-07-04T12:00:00Z');
    const parsed = parseJson<{ at: Temporal.Instant }>(JSON.stringify({ at: instant }));
    expect(parsed.at).toBeInstanceOf(Temporal.Instant);
    expect(parsed.at.equals(instant)).toBe(true);
  });

  it('parses non-object roots', () => {
    expect(parseJson<number>('5')).toBe(5);
    expect(parseJson<Temporal.PlainDate>('"2026-07-04"')).toBeInstanceOf(Temporal.PlainDate);
  });
});
