import { describe, expect, it } from 'vitest';

import { ApiError } from '@src/foundation/http';

import { defaultMapFieldPath, resolveSubmitFailure, toApiError } from '@src/forms-engine/SubmitErrors';

describe('defaultMapFieldPath', () => {
  it('camelCases each property segment, preserving indices', () => {
    expect(defaultMapFieldPath('Name')).toBe('name');
    expect(defaultMapFieldPath('Rules[0].Destination')).toBe('rules[0].destination');
    expect(defaultMapFieldPath('Style.CornerColor')).toBe('style.cornerColor');
  });

  it('leaves already-camel paths untouched', () => {
    expect(defaultMapFieldPath('rules[0].destination')).toBe('rules[0].destination');
  });
});

describe('toApiError', () => {
  it('passes an ApiError through by reference', () => {
    const error = new ApiError(400, null);
    expect(toApiError(error)).toBe(error);
  });

  it('wraps Error and string throws as status 0', () => {
    const wrapped = toApiError(new Error('network down'));
    expect(wrapped).toBeInstanceOf(ApiError);
    expect(wrapped.status).toBe(0);
    expect(wrapped.message).toBe('network down');
    expect(toApiError('oops').message).toBe('oops');
    expect(toApiError(42).message).toBe('Unknown error');
  });
});

describe('resolveSubmitFailure', () => {
  const isKnownField = (path: string) =>
    path === 'name' || path === 'rules[0].destination';

  it('lands fully-matched errors on fields with no submitError', () => {
    const error = new ApiError(400, { errors: { Name: ['Taken'], 'Rules[0].Destination': ['Bad'] } });
    const resolution = resolveSubmitFailure(
      error,
      () => ({ Name: ['Taken'], 'Rules[0].Destination': ['Bad'] }),
      defaultMapFieldPath,
      isKnownField,
    );

    expect(resolution.fieldErrors).toEqual({ name: ['Taken'], 'rules[0].destination': ['Bad'] });
    expect(resolution.submitError).toBeNull();
  });

  it('keeps the failure in submitError when no mapped path matches', () => {
    const error = new ApiError(409, null);
    const resolution = resolveSubmitFailure(error, () => ({ Ghost: ['x'] }), defaultMapFieldPath, isKnownField);

    expect(resolution.fieldErrors).toEqual({});
    expect(resolution.submitError).toBe(error);
  });

  it('keeps the failure in submitError on a partial match (no message silently drops)', () => {
    const error = new ApiError(400, null);
    const resolution = resolveSubmitFailure(
      error,
      () => ({ Name: ['Taken'], Ghost: ['x'] }),
      defaultMapFieldPath,
      isKnownField,
    );

    expect(resolution.fieldErrors).toEqual({ name: ['Taken'] });
    expect(resolution.submitError).toBe(error);
  });

  it('aggregates messages when two server paths map onto one form path', () => {
    const resolution = resolveSubmitFailure(
      new ApiError(400, null),
      () => ({ Name: ['A'], name: ['B'] }),
      defaultMapFieldPath,
      isKnownField,
    );

    expect(resolution.fieldErrors).toEqual({ name: ['A', 'B'] });
    expect(resolution.submitError).toBeNull();
  });

  it('an empty map resolves to submitError only (coerced)', () => {
    const resolution = resolveSubmitFailure(new Error('boom'), () => ({}), defaultMapFieldPath, isKnownField);

    expect(resolution.fieldErrors).toEqual({});
    expect(resolution.submitError).toBeInstanceOf(ApiError);
    expect(resolution.submitError?.message).toBe('boom');
  });
});
