/* ---------------------------------------------------------------------------
 * fieldErrors tests.
 *
 * Contract: extracts the `errors` validation member of an ApiError's problem
 * body as `field → messages`. The ASP.NET ModelState dict ({ field: string[] },
 * bare string = one message) and the wow-two array shape ([{ property,
 * message }]) both normalize; everything else yields {}.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest';

import { ApiError } from '@src/foundation/http/ApiError';
import { fieldErrors } from '@src/foundation/http/FieldErrors';

const withErrors = (errors: unknown): ApiError => new ApiError(400, { title: 'Validation failed', errors });

describe('fieldErrors extraction', () => {
  const cases: ReadonlyArray<[desc: string, error: unknown, expected: Record<string, string[]>]> = [
    [
      'ModelState dict passes through',
      withErrors({ name: ['Required'], email: ['Invalid', 'Taken'] }),
      { name: ['Required'], email: ['Invalid', 'Taken'] },
    ],
    ['bare string dict value counts as one message', withErrors({ name: 'Required' }), { name: ['Required'] }],
    [
      'non-string dict values are filtered; all-filtered fields are dropped',
      withErrors({ name: ['Required', 42, null], age: [1] }),
      { name: ['Required'] },
    ],
    ['empty dict yields {}', withErrors({}), {}],
    [
      'array shape groups messages by property',
      withErrors([
        { property: 'name', message: 'Required' },
        { property: 'name', message: 'Too short' },
        { property: 'email', message: 'Invalid', code: 'E1' },
      ]),
      { name: ['Required', 'Too short'], email: ['Invalid'] },
    ],
    [
      'array entries missing property or message are skipped',
      withErrors([{ property: 'name' }, { message: 'orphan' }, 'junk', null]),
      {},
    ],
    ['scalar errors member yields {}', withErrors('boom'), {}],
    ['problem without an errors member yields {}', new ApiError(400, { title: 'Bad request' }), {}],
    ['null problem yields {}', new ApiError(0, null, 'offline'), {}],
    ['plain Error yields {}', new Error('not api'), {}],
    ['non-error value yields {}', 'nope', {}],
  ];

  it.each(cases)('%s', (_desc, error, expected) => {
    expect(fieldErrors(error)).toEqual(expected);
  });
});
