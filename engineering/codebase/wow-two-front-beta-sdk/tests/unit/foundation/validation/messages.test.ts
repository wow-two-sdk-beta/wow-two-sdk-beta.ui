import { describe, expect, it } from 'vitest';

import { ApiError, fieldErrors, fieldIssues } from '@src/foundation/http';
import {
  FLUENT_VALIDATION_CODES,
  array,
  createMessageResolver,
  defaultValidationMessages,
  object,
  string,
  type FieldIssue,
} from '@src/foundation/validation';

// The point of the catalogue is ONE voice per rule. These tests pin the three things that makes true:
// the server's rule code surviving the read, the client validator's code + operands surviving the run,
// and both sides landing on the same catalogue entry.

describe('fieldIssues', () => {
  it('keeps the rule code from the wow-two array shape, normalized onto the shared vocabulary', () => {
    const error = new ApiError(400, {
      errors: [{ property: 'Name', message: 'URL is required.', code: 'NotEmptyValidator' }],
    });
    expect(fieldIssues(error)).toEqual({ Name: [{ message: 'URL is required.', code: 'required', params: undefined }] });
  });

  it('renames FluentValidation placeholders onto the vocabulary param names', () => {
    const error = new ApiError(400, {
      errors: [
        {
          property: 'Name',
          message: "'Name' must be 50 characters or fewer.",
          code: 'MaximumLengthValidator',
          params: { MaxLength: 50, PropertyName: 'Name' },
        },
      ],
    });
    expect(fieldIssues(error).Name?.[0]?.params).toEqual({ max: 50, PropertyName: 'Name' });
  });

  it('passes an unrecognized code through rather than dropping it', () => {
    const error = new ApiError(400, {
      errors: [{ property: 'Slug', message: 'nope', code: 'SlugAlreadyTakenValidator' }],
    });
    expect(fieldIssues(error).Slug?.[0]?.code).toBe('SlugAlreadyTakenValidator');
  });

  it('reports the ModelState dict shape as code-less issues', () => {
    const error = new ApiError(400, { errors: { Name: ['Taken', 'Too long'], Slug: 'Bad' } });
    expect(fieldIssues(error)).toEqual({
      Name: [{ message: 'Taken' }, { message: 'Too long' }],
      Slug: [{ message: 'Bad' }],
    });
  });

  it('yields {} for anything that is not an ApiError carrying errors', () => {
    expect(fieldIssues(new Error('boom'))).toEqual({});
    expect(fieldIssues(new ApiError(500, null))).toEqual({});
  });
});

describe('fieldErrors', () => {
  it('still reports the message-only shape every existing caller expects', () => {
    const error = new ApiError(400, {
      errors: [{ property: 'Name', message: 'URL is required.', code: 'NotEmptyValidator' }],
    });
    expect(fieldErrors(error)).toEqual({ Name: ['URL is required.'] });
  });
});

describe('createMessageResolver', () => {
  const resolve = createMessageResolver();

  it('renders a known code from the default catalogue, ignoring the source wording', () => {
    expect(resolve({ message: "'Name' must not be empty.", code: 'required' }, 'name')).toBe('is required');
  });

  it('falls back to the source message for a code no entry covers', () => {
    expect(resolve({ message: 'Slug already taken', code: 'SlugAlreadyTakenValidator' }, 'slug')).toBe(
      'Slug already taken',
    );
  });

  it('falls back to the source message when the issue carries no code at all', () => {
    expect(resolve({ message: 'Taken' }, 'name')).toBe('Taken');
  });

  it('renders operands, and defers to the source message when the operand never arrived', () => {
    expect(resolve({ message: 'x', code: 'max', params: { max: 50, unit: 'characters' } }, 'name')).toBe(
      'must be at most 50 characters',
    );
    expect(resolve({ message: 'must be at most 50 characters', code: 'max' }, 'name')).toBe(
      'must be at most 50 characters',
    );
  });

  it('reads a numeric operand that arrived as a JSON string', () => {
    expect(resolve({ message: 'x', code: 'min', params: { min: '2', unit: 'characters' } }, 'name')).toBe(
      'must be at least 2 characters',
    );
  });

  it('singularizes a count of one', () => {
    expect(resolve({ message: 'x', code: 'min', params: { min: 1, unit: 'items' } }, 'rules')).toBe(
      'must have at least 1 item',
    );
  });

  it('prefixes a label when the form named the field, matching a row path by its de-indexed key', () => {
    const labelled = createMessageResolver(undefined, {
      name: 'Name',
      'rules[].destination': 'Destination',
    });
    expect(labelled({ message: 'x', code: 'required' }, 'name')).toBe('Name is required');
    expect(labelled({ message: 'x', code: 'required' }, 'rules[3].destination')).toBe('Destination is required');
  });

  it('does not prefix a label onto a message it merely passed through', () => {
    const labelled = createMessageResolver(undefined, { slug: 'Slug' });
    expect(labelled({ message: 'Slug already taken', code: 'unknownCode' }, 'slug')).toBe('Slug already taken');
  });

  it('merges a caller catalogue over the defaults rather than replacing them', () => {
    const custom = createMessageResolver({ required: () => 'majburiy' });
    expect(custom({ message: 'x', code: 'required' }, 'name')).toBe('majburiy');
    expect(custom({ message: 'x', code: 'email' }, 'email')).toBe('must be a valid email address');
  });

  it('defers to the source message when a caller entry throws', () => {
    const hostile = createMessageResolver({
      required: () => {
        throw new Error('bad entry');
      },
    });
    expect(hostile({ message: "'Name' must not be empty.", code: 'required' }, 'name')).toBe(
      "'Name' must not be empty.",
    );
  });
});

describe('one voice across both sides', () => {
  // The whole reason the vector exists: the same rule, caught by either layer, must read identically.
  const resolve = createMessageResolver(undefined, { name: 'Name' });

  const fromServer: FieldIssue = {
    message: "'Name' must not be empty.",
    code: FLUENT_VALIDATION_CODES.NotEmptyValidator,
  };
  const fromClient: FieldIssue = { message: 'expected string, received undefined', code: 'required' };

  it('renders a server failure and a client failure of the same rule identically', () => {
    expect(resolve(fromServer, 'name')).toBe(resolve(fromClient, 'name'));
    expect(resolve(fromServer, 'name')).toBe('Name is required');
  });
});

describe('house validator operands', () => {
  it('reports the limit alongside the code so a catalogue can re-render it', () => {
    const result = string().max(3).validate('abcd');
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.issues[0]?.code).toBe('max');
    expect(result.issues[0]?.params).toEqual({ max: 3, unit: 'characters' });
  });

  it('reports collection limits with the items unit', () => {
    const result = array(string()).min(2).validate(['a']);
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.issues[0]?.params).toEqual({ min: 2, unit: 'items' });
  });

  it('threads code + operands through a nested object path', () => {
    const result = object({ profile: object({ bio: string().max(2) }) }).validate({
      profile: { bio: 'long' },
    });
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.issues[0]?.path).toEqual(['profile', 'bio']);
    expect(result.issues[0]?.code).toBe('max');
  });
});

describe('defaultValidationMessages', () => {
  it('covers every code the alias table can produce', () => {
    const produced = new Set(Object.values(FLUENT_VALIDATION_CODES));
    const uncovered = [...produced].filter((code) => !(code in defaultValidationMessages));
    expect(uncovered).toEqual([]);
  });
});
