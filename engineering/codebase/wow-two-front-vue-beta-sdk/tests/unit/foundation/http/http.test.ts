import { describe, expect, it } from 'vitest';
import { Temporal } from 'temporal-polyfill';
import { ApiError, fieldErrors, parseJson, temporalReviver } from '@src/foundation/http';

/*
 * Smoke depth, `unit` project (node). The slice's defining contract is the wire seam: an
 * ISO-shaped string arrives as a `Temporal.*` value, everything else arrives untouched, and an
 * ISO-SHAPED-BUT-INVALID string falls back to the raw string instead of throwing — the last of
 * those is what keeps one bad server field from taking down a whole response parse.
 */

describe('temporalReviver', () => {
  it('upgrades each ISO shape to its Temporal kind', () => {
    expect(temporalReviver('k', '2026-08-13T10:30:00Z')).toBeInstanceOf(Temporal.Instant);
    expect(temporalReviver('k', '2026-08-13')).toBeInstanceOf(Temporal.PlainDate);
    expect(temporalReviver('k', '10:30:00')).toBeInstanceOf(Temporal.PlainTime);
    expect(temporalReviver('k', 'PT1H30M')).toBeInstanceOf(Temporal.Duration);
  });

  it('leaves a non-matching string and every non-string value alone', () => {
    expect(temporalReviver('k', 'not a date')).toBe('not a date');
    expect(temporalReviver('k', 42)).toBe(42);
    expect(temporalReviver('k', null)).toBeNull();
  });

  it('falls back to the raw string for an ISO-shaped but invalid value', () => {
    expect(temporalReviver('k', '2026-13-40')).toBe('2026-13-40');
  });
});

describe('parseJson', () => {
  it('revives date fields inside a parsed payload', () => {
    const parsed = parseJson<{ id: number; createdAt: Temporal.PlainDate; name: string }>(
      '{"id":1,"createdAt":"2026-08-13","name":"widget"}',
    );

    expect(parsed.createdAt).toBeInstanceOf(Temporal.PlainDate);
    expect(parsed.createdAt.toString()).toBe('2026-08-13');
    expect(parsed.name).toBe('widget');
  });
});

describe('fieldErrors', () => {
  /* Total by contract: anything that is not a field-carrying failure yields an empty map rather
     than throwing, so a caller can render it unconditionally. */
  it('returns an empty map for a value carrying no field errors', () => {
    expect(fieldErrors(new Error('boom'))).toEqual({});
    expect(fieldErrors(undefined)).toEqual({});
  });
});

describe('ApiError', () => {
  it('is an Error, so an unaware catch block still reads its message', () => {
    const error = new ApiError(404, { title: 'Not found' });
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
  });

  /* No message and no problem body still has to read as something — a bare `Error: undefined`
     in a toast is the failure mode this guards. */
  it('falls back to a status message when handed neither', () => {
    expect(new ApiError(500, null).message).toBe('Request failed with status 500');
  });
});
