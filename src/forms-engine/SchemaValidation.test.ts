import { describe, expect, it } from 'vitest';

import { issuePathToString, resultToFieldErrors, runStandardSchema } from './SchemaValidation';
import type { StandardSchemaV1 } from './StandardSchema';

function schemaWith<TValues extends object>(
  validate: StandardSchemaV1.Props<TValues, TValues>['validate'],
): StandardSchemaV1<TValues> {
  return { '~standard': { version: 1, vendor: 'test', validate } };
}

describe('issuePathToString', () => {
  it('normalizes plain keys, numbers, and { key } segments to the canonical path form', () => {
    expect(issuePathToString(['name'])).toBe('name');
    expect(issuePathToString(['rules', 0, 'destination'])).toBe('rules[0].destination');
    expect(issuePathToString([{ key: 'rules' }, { key: 0 }, { key: 'destination' }])).toBe('rules[0].destination');
  });

  it('keys root-level issues under the empty path', () => {
    expect(issuePathToString(undefined)).toBe('');
    expect(issuePathToString([])).toBe('');
  });
});

describe('resultToFieldErrors', () => {
  it('folds issues into path → messages, aggregating per path', () => {
    expect(
      resultToFieldErrors({
        issues: [
          { message: 'Required', path: ['name'] },
          { message: 'Too short', path: ['name'] },
          { message: 'Whole form broken' },
        ],
      }),
    ).toEqual({ name: ['Required', 'Too short'], '': ['Whole form broken'] });
  });

  it('yields {} for a success result', () => {
    expect(resultToFieldErrors({ value: { name: 'x' } })).toEqual({});
  });
});

describe('runStandardSchema', () => {
  it('resolves sync schemas synchronously (no promise tick)', () => {
    const schema = schemaWith<{ name: string }>((value) => {
      const values = value as { name: string };
      return values.name === '' ? { issues: [{ message: 'Required', path: ['name'] }] } : { value: values };
    });

    const invalid = runStandardSchema(schema, { name: '' });
    expect(invalid).not.toBeInstanceOf(Promise);
    expect(invalid).toEqual({ name: ['Required'] });

    expect(runStandardSchema(schema, { name: 'x' })).toEqual({});
  });

  it('resolves async schemas through a promise', async () => {
    const schema = schemaWith<{ name: string }>(async () => ({
      issues: [{ message: 'Async required', path: [{ key: 'name' }] }],
    }));

    const outcome = runStandardSchema(schema, { name: '' });
    expect(outcome).toBeInstanceOf(Promise);
    await expect(outcome).resolves.toEqual({ name: ['Async required'] });
  });
});
