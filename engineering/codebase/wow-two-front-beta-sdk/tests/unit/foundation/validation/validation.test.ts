import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  ValidationError,
  Validator,
  array,
  assertValid,
  boolean,
  date,
  describeType,
  email,
  formatIssuePath,
  isoDate,
  literal,
  number,
  object,
  oneOf,
  record,
  string,
  toStandardSchema,
  tuple,
  union,
  url,
  uuid,
  type Infer,
  type ValidationIssue,
} from '@src/foundation/validation';

// The two imports below reach UP into `forms-engine` on purpose, and only tests may do it (ESLint turns
// `boundaries` off for `tests/**`). They are the point of the slice: a validator built in `foundation`
// must satisfy the REAL spec type the forms engine consumes and survive its REAL runner unchanged. A
// local re-assertion of the spec shape would prove nothing — it would only test this file's own copy.
import { runStandardSchema } from '@src/forms-engine/SchemaValidation';
import type { StandardSchemaV1 as FormsEngineStandardSchemaV1 } from '@src/forms-engine/StandardSchema';

/** Reads issues off a result, failing loudly if it unexpectedly succeeded. */
function issuesOf(result: { valid: boolean; issues?: readonly ValidationIssue[] }): readonly ValidationIssue[] {
  if (result.valid || !result.issues) throw new Error('expected the result to be invalid');
  return result.issues;
}

/** Compresses issues to `path → message` pairs, the shape most assertions here care about. */
function addressed(result: { valid: boolean; issues?: readonly ValidationIssue[] }): [string, string][] {
  return issuesOf(result).map((issue) => [formatIssuePath(issue.path), issue.message]);
}

describe('result vocabulary', () => {
  it('names a value type without touching the value', () => {
    expect(describeType('a')).toBe('string');
    expect(describeType(1)).toBe('number');
    expect(describeType(Number.NaN)).toBe('NaN');
    expect(describeType(null)).toBe('null');
    expect(describeType(undefined)).toBe('undefined');
    expect(describeType([])).toBe('array');
    expect(describeType({})).toBe('object');
    expect(describeType(new Date())).toBe('Date');
    expect(describeType(Symbol('s'))).toBe('symbol');
  });

  it('renders an issue path in display form', () => {
    expect(formatIssuePath([])).toBe('');
    expect(formatIssuePath(['name'])).toBe('name');
    expect(formatIssuePath(['items', 0, 'name'])).toBe('items[0].name');
    expect(formatIssuePath([0])).toBe('[0]');
  });
});

describe('string', () => {
  it('accepts a string and rejects everything else', () => {
    expect(string().validate('hello')).toEqual({ valid: true, value: 'hello' });
    expect(addressed(string().validate(42))).toEqual([['', 'expected string, received number']]);
    expect(issuesOf(string().validate(42)).at(0)?.code).toBe('type');
  });

  it('enforces min, max, and length', () => {
    expect(string().min(3).validate('abc').valid).toBe(true);
    expect(addressed(string().min(3).validate('ab'))).toEqual([['', 'must be at least 3 characters']]);
    expect(string().max(3).validate('abc').valid).toBe(true);
    expect(addressed(string().max(2).validate('abc'))).toEqual([['', 'must be at most 2 characters']]);
    expect(string().length(2).validate('ab').valid).toBe(true);
    expect(addressed(string().length(2).validate('abc'))).toEqual([['', 'must be exactly 2 characters']]);
  });

  it('singularizes the count in generated messages', () => {
    expect(addressed(string().min(1).validate(''))).toEqual([['', 'must be at least 1 character']]);
  });

  it('enforces a pattern and honours a custom message', () => {
    expect(string().pattern(/^a+$/).validate('aaa').valid).toBe(true);
    expect(addressed(string().pattern(/^a+$/, 'letters a only').validate('b'))).toEqual([
      ['', 'letters a only'],
    ]);
  });

  it('is not made stateful by a global regex', () => {
    // A `g` regex advances `lastIndex` on every `.test`, so a stateful implementation passes the first
    // call and fails the second on identical input.
    const validator = string().pattern(/ab/g);
    expect(validator.validate('abab').valid).toBe(true);
    expect(validator.validate('abab').valid).toBe(true);
    expect(validator.validate('abab').valid).toBe(true);
  });

  it('keeps refinements chainable on the string class', () => {
    const validator = string().min(2).max(4).pattern(/^[a-z]+$/);
    expect(validator.validate('abc').valid).toBe(true);
    expect(validator.validate('a').valid).toBe(false);
    expect(validator.validate('abcde').valid).toBe(false);
    expect(validator.validate('ABC').valid).toBe(false);
  });
});

describe('number', () => {
  it('accepts finite numbers only', () => {
    expect(number().validate(42)).toEqual({ valid: true, value: 42 });
    expect(number().validate(0)).toEqual({ valid: true, value: 0 });
    expect(number().validate(-1.5)).toEqual({ valid: true, value: -1.5 });
    expect(addressed(number().validate(Number.NaN))).toEqual([['', 'expected number, received NaN']]);
    expect(number().validate(Number.POSITIVE_INFINITY).valid).toBe(false);
    expect(number().validate('42').valid).toBe(false);
  });

  it('enforces min, max, and integer', () => {
    expect(number().min(10).validate(10).valid).toBe(true);
    expect(addressed(number().min(10).validate(9))).toEqual([['', 'must be at least 10']]);
    expect(number().max(10).validate(10).valid).toBe(true);
    expect(addressed(number().max(10).validate(11))).toEqual([['', 'must be at most 10']]);
    expect(number().integer().validate(3).valid).toBe(true);
    expect(addressed(number().integer().validate(3.5))).toEqual([['', 'must be a whole number']]);
  });
});

describe('boolean, date, literal, oneOf', () => {
  it('accepts booleans and rejects their string spellings', () => {
    expect(boolean().validate(true)).toEqual({ valid: true, value: true });
    expect(boolean().validate(false)).toEqual({ valid: true, value: false });
    expect(boolean().validate('true').valid).toBe(false);
    expect(boolean().validate(1).valid).toBe(false);
  });

  it('accepts a real Date and rejects an Invalid Date', () => {
    const now = new Date('2026-07-20T00:00:00.000Z');
    expect(date().validate(now)).toEqual({ valid: true, value: now });
    expect(addressed(date().validate(new Date('nonsense')))).toEqual([
      ['', 'expected Date, received Date'],
    ]);
    expect(date().validate('2026-07-20').valid).toBe(false);
  });

  it('enforces date bounds', () => {
    const floor = new Date('2026-01-01T00:00:00.000Z');
    const ceiling = new Date('2026-12-31T00:00:00.000Z');
    const validator = date().min(floor).max(ceiling);
    expect(validator.validate(new Date('2026-06-01T00:00:00.000Z')).valid).toBe(true);
    expect(validator.validate(new Date('2025-06-01T00:00:00.000Z')).valid).toBe(false);
    expect(validator.validate(new Date('2027-06-01T00:00:00.000Z')).valid).toBe(false);
  });

  it('matches a literal exactly', () => {
    expect(literal('draft').validate('draft')).toEqual({ valid: true, value: 'draft' });
    expect(addressed(literal('draft').validate('published'))).toEqual([['', 'must be "draft"']]);
    expect(literal(null).validate(null).valid).toBe(true);
    expect(literal(7).validate('7').valid).toBe(false);
  });

  it('matches any member of oneOf', () => {
    const status = oneOf(['draft', 'live']);
    expect(status.validate('live')).toEqual({ valid: true, value: 'live' });
    expect(addressed(status.validate('archived'))).toEqual([['', 'must be one of: draft, live']]);
  });
});

describe('formats', () => {
  it('accepts ordinary addresses and rejects obvious breakage', () => {
    expect(email().validate('a@b.co').valid).toBe(true);
    expect(email().validate('first.last+tag@sub.example.com').valid).toBe(true);
    expect(email().validate('no-at-sign').valid).toBe(false);
    expect(email().validate('two@@example.com').valid).toBe(false);
    expect(email().validate('no@domain').valid).toBe(false);
    expect(email().validate('spaces in@example.com').valid).toBe(false);
    expect(addressed(email().validate('nope'))).toEqual([['', 'must be a valid email address']]);
  });

  it('validates a URL through the URL constructor', () => {
    expect(url().validate('https://example.com/path?q=1').valid).toBe(true);
    expect(url().validate('not a url').valid).toBe(false);
    expect(url().validate('/relative/path').valid).toBe(false);
    // Documented: any scheme parses — restrict with `.refine()` when the value reaches an `href`.
    expect(url().validate('javascript:alert(1)').valid).toBe(true);
  });

  it('validates a canonical UUID', () => {
    expect(uuid().validate('f47ac10b-58cc-4372-a567-0e02b2c3d479').valid).toBe(true);
    expect(uuid().validate('F47AC10B-58CC-4372-A567-0E02B2C3D479').valid).toBe(true);
    expect(uuid().validate('not-a-uuid').valid).toBe(false);
    // Documented rejection: the nil UUID has no version nibble.
    expect(uuid().validate('00000000-0000-0000-0000-000000000000').valid).toBe(false);
  });

  it('validates an ISO calendar date and rejects a day that does not exist', () => {
    expect(isoDate().validate('2026-07-20').valid).toBe(true);
    expect(isoDate().validate('2024-02-29').valid).toBe(true);
    expect(isoDate().validate('2025-02-30').valid).toBe(false);
    expect(isoDate().validate('2025-13-01').valid).toBe(false);
    expect(isoDate().validate('2026-07-20T10:00:00Z').valid).toBe(false);
    expect(isoDate().validate('20-07-2026').valid).toBe(false);
  });

  it('composes a format with further refinements', () => {
    expect(email().max(8).validate('a@b.co').valid).toBe(true);
    expect(email().max(4).validate('a@b.co').valid).toBe(false);
  });
});

describe('optional, nullable, default', () => {
  it('passes undefined through optional but still checks other values', () => {
    const validator = string().optional();
    expect(validator.validate(undefined)).toEqual({ valid: true, value: undefined });
    expect(validator.validate('a')).toEqual({ valid: true, value: 'a' });
    expect(validator.validate(null).valid).toBe(false);
    expect(validator.validate(5).valid).toBe(false);
  });

  it('passes null through nullable but still checks other values', () => {
    const validator = string().nullable();
    expect(validator.validate(null)).toEqual({ valid: true, value: null });
    expect(validator.validate('a')).toEqual({ valid: true, value: 'a' });
    expect(validator.validate(undefined).valid).toBe(false);
  });

  it('applies default to undefined but NOT to null', () => {
    const validator = string().default('fallback');
    expect(validator.validate(undefined)).toEqual({ valid: true, value: 'fallback' });
    expect(validator.validate('given')).toEqual({ valid: true, value: 'given' });
    // The documented split: an explicit `null` is a chosen value, not an absent one, so it keeps
    // flowing into the inner validator and is rejected there.
    expect(validator.validate(null).valid).toBe(false);
  });

  it('defaults a nullable validator only on undefined, leaving null intact', () => {
    const validator = string().nullable().default('fallback');
    expect(validator.validate(undefined)).toEqual({ valid: true, value: 'fallback' });
    expect(validator.validate(null)).toEqual({ valid: true, value: null });
  });

  it('still enforces the inner rules when a value is present', () => {
    const validator = string().min(3).optional().default('abc');
    expect(validator.validate(undefined)).toEqual({ valid: true, value: 'abc' });
    expect(validator.validate('ab').valid).toBe(false);
  });
});

describe('refine and transform', () => {
  it('runs a refinement only after the base check passes', () => {
    const even = number().refine((value) => value % 2 === 0, 'must be even', 'even');
    expect(even.validate(4).valid).toBe(true);
    expect(addressed(even.validate(3))).toEqual([['', 'must be even']]);
    expect(issuesOf(even.validate(3)).at(0)?.code).toBe('even');
    // A non-number never reaches the refinement — it fails the type check first, with the type message.
    expect(addressed(even.validate('x'))).toEqual([['', 'expected number, received string']]);
  });

  it('treats a throwing refinement as a failure rather than propagating', () => {
    const exploding = string().refine(() => {
      throw new Error('boom');
    }, 'rejected');
    expect(() => exploding.validate('a')).not.toThrow();
    expect(addressed(exploding.validate('a'))).toEqual([['', 'rejected']]);
  });

  it('applies a transform after validation', () => {
    const parsed = string().transform((value) => value.length);
    expect(parsed.validate('abcd')).toEqual({ valid: true, value: 4 });
    // The transform never runs on an invalid value — the original type message survives.
    expect(addressed(parsed.validate(99))).toEqual([['', 'expected string, received number']]);
  });

  it('runs a transform after the refinements, not before', () => {
    const validator = string().min(3).transform((value) => value.toUpperCase());
    expect(validator.validate('abc')).toEqual({ valid: true, value: 'ABC' });
    expect(addressed(validator.validate('ab'))).toEqual([['', 'must be at least 3 characters']]);
  });

  it('reports a throwing transform as an issue', () => {
    const validator = string().transform(() => {
      throw new Error('boom');
    });
    expect(() => validator.validate('a')).not.toThrow();
    expect(issuesOf(validator.validate('a')).at(0)?.code).toBe('transform');
  });

  it('carries a transform through a composite', () => {
    const validator = object({ tags: array(string().transform((value) => value.trim())) });
    expect(validator.validate({ tags: [' a ', ' b'] })).toEqual({
      valid: true,
      value: { tags: ['a', 'b'] },
    });
  });
});

describe('object', () => {
  const user = object({
    name: string().min(2),
    age: number().integer(),
    nickname: string().optional(),
  });

  it('accepts a well-formed object', () => {
    expect(user.validate({ name: 'Ann', age: 30 })).toEqual({
      valid: true,
      value: { name: 'Ann', age: 30 },
    });
  });

  it('collects EVERY failing property, not just the first', () => {
    expect(addressed(user.validate({ name: 'A', age: 1.5 }))).toEqual([
      ['name', 'must be at least 2 characters'],
      ['age', 'must be a whole number'],
    ]);
  });

  it('reports a missing required property under its own key', () => {
    expect(addressed(user.validate({}))).toEqual([
      ['name', 'expected string, received undefined'],
      ['age', 'expected number, received undefined'],
    ]);
  });

  it('strips unknown keys from the output', () => {
    const result = user.validate({ name: 'Ann', age: 30, isAdmin: true });
    expect(result).toEqual({ valid: true, value: { name: 'Ann', age: 30 } });
    expect(result.valid && 'isAdmin' in result.value).toBe(false);
  });

  it('leaves an absent optional key absent rather than writing undefined', () => {
    const result = user.validate({ name: 'Ann', age: 30 });
    expect(result.valid && 'nickname' in result.value).toBe(false);
    const present = user.validate({ name: 'Ann', age: 30, nickname: 'A' });
    expect(present.valid && present.value.nickname).toBe('A');
  });

  it('rejects a non-object, including an array and null', () => {
    expect(addressed(user.validate(null))).toEqual([['', 'expected object, received null']]);
    expect(addressed(user.validate([]))).toEqual([['', 'expected object, received array']]);
    expect(addressed(user.validate('x'))).toEqual([['', 'expected object, received string']]);
  });
});

describe('nested paths', () => {
  const order = object({
    id: uuid(),
    items: array(
      object({
        name: string().min(1),
        qty: number().integer().min(1),
      }),
    ),
  });

  it('addresses every issue through nested objects and arrays', () => {
    const result = order.validate({
      id: 'not-a-uuid',
      items: [
        { name: '', qty: 0 },
        { name: 'ok', qty: 2 },
        { name: 'ok', qty: 'two' },
      ],
    });

    expect(addressed(result)).toEqual([
      ['id', 'must be a valid UUID'],
      ['items[0].name', 'must be at least 1 character'],
      ['items[0].qty', 'must be at least 1'],
      ['items[2].qty', 'expected number, received string'],
    ]);
  });

  it('keeps path segments machine-readable, with numeric indices', () => {
    const result = order.validate({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      items: [{ name: '', qty: 1 }],
    });
    expect(issuesOf(result).at(0)?.path).toEqual(['items', 0, 'name']);
  });
});

describe('array', () => {
  it('reports each bad item at its own index and keeps going', () => {
    expect(addressed(array(number()).validate([1, 'a', 3, 'b']))).toEqual([
      ['[1]', 'expected number, received string'],
      ['[3]', 'expected number, received string'],
    ]);
  });

  it('accepts an empty array and enforces length rules', () => {
    expect(array(number()).validate([])).toEqual({ valid: true, value: [] });
    expect(addressed(array(number()).min(1).validate([]))).toEqual([['', 'must have at least 1 item']]);
    expect(addressed(array(number()).max(1).validate([1, 2]))).toEqual([
      ['', 'must have at most 1 item'],
    ]);
    expect(array(number()).length(2).validate([1, 2]).valid).toBe(true);
    expect(addressed(array(number()).length(2).validate([1]))).toEqual([
      ['', 'must have exactly 2 items'],
    ]);
  });

  it('rejects a non-array', () => {
    expect(addressed(array(number()).validate({}))).toEqual([['', 'expected array, received object']]);
  });
});

describe('record', () => {
  const scores = record(number().min(0));

  it('validates every value under its own key', () => {
    expect(scores.validate({ a: 1, b: 2 })).toEqual({ valid: true, value: { a: 1, b: 2 } });
    expect(addressed(scores.validate({ a: -1, b: 'x' }))).toEqual([
      ['a', 'must be at least 0'],
      ['b', 'expected number, received string'],
    ]);
  });

  it('accepts an empty record and rejects a non-object', () => {
    expect(scores.validate({})).toEqual({ valid: true, value: {} });
    expect(scores.validate([]).valid).toBe(false);
  });

  it('stores a __proto__ key as data instead of hitting the prototype setter', () => {
    // `JSON.parse` produces `__proto__` as a real own property — the exact shape a hostile payload uses.
    const payload: unknown = JSON.parse('{"__proto__":"pwned","safe":"ok"}');
    const result = record(string()).validate(payload);

    expect(result.valid).toBe(true);
    const output = result.valid ? result.value : {};
    expect(Object.prototype.hasOwnProperty.call(output, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
  });
});

describe('union', () => {
  const id = union([string(), number()]);

  it('accepts any branch, first match winning', () => {
    expect(id.validate('abc')).toEqual({ valid: true, value: 'abc' });
    expect(id.validate(7)).toEqual({ valid: true, value: 7 });
  });

  it('reports ONE issue naming the alternatives, not every branch failure', () => {
    const result = id.validate(true);
    expect(issuesOf(result)).toHaveLength(1);
    expect(addressed(result)).toEqual([['', 'expected string | number, received boolean']]);
    expect(issuesOf(result).at(0)?.code).toBe('union');
  });

  it('keeps the single-issue rule inside a composite, addressed at the member', () => {
    const validator = object({ id: union([string(), number(), literal(null)]) });
    const result = validator.validate({ id: true });
    expect(issuesOf(result)).toHaveLength(1);
    expect(addressed(result)).toEqual([
      ['id', 'expected string | number | literal null, received boolean'],
    ]);
  });
});

describe('tuple', () => {
  const point = tuple([number(), number(), string()]);

  it('accepts a matching tuple', () => {
    expect(point.validate([1, 2, 'label'])).toEqual({ valid: true, value: [1, 2, 'label'] });
  });

  it('reports a length mismatch once, at the tuple itself', () => {
    expect(addressed(point.validate([1, 2]))).toEqual([['', 'expected exactly 3 items, received 2']]);
  });

  it('reports every positional failure at its index', () => {
    expect(addressed(point.validate(['a', 2, 9]))).toEqual([
      ['[0]', 'expected number, received string'],
      ['[2]', 'expected string, received number'],
    ]);
  });

  it('rejects a non-array', () => {
    expect(addressed(point.validate('nope'))).toEqual([['', 'expected array, received string']]);
  });
});

describe('standard schema bridge', () => {
  const validator = object({ name: string().min(2) });

  it('exposes spec-shaped props', () => {
    const props = validator['~standard'];
    expect(props.version).toBe(1);
    expect(props.vendor).toBe('wow-two-beta');
    expect(typeof props.validate).toBe('function');
  });

  it('returns a spec success result when validate is invoked directly', () => {
    const result = validator['~standard'].validate({ name: 'Ann' });
    expect(result).not.toBeInstanceOf(Promise);
    // Spec success: `{ value }` with `issues` absent/undefined.
    expect(result).toEqual({ value: { name: 'Ann' } });
    expect('issues' in result ? result.issues : undefined).toBeUndefined();
  });

  it('returns spec-shaped issues with PropertyKey paths when validate is invoked directly', () => {
    const result = validator['~standard'].validate({ name: 'A' });
    expect(result).not.toBeInstanceOf(Promise);
    const issues = 'issues' in result ? result.issues : undefined;
    expect(issues).toEqual([{ message: 'must be at least 2 characters', path: ['name'] }]);
  });

  it('reports a root failure with an empty path, per the spec', () => {
    const result = validator['~standard'].validate('not an object');
    const issues = 'issues' in result ? result.issues : undefined;
    expect(issues).toEqual([{ message: 'expected object, received string', path: [] }]);
  });

  it('satisfies the REAL forms-engine spec type', () => {
    // Compile-time proof: assigning to the forms engine's own `StandardSchemaV1<T>` — the exact type
    // `AppFormOptions.schema` is declared with — is what "drops in unchanged" means. If this file
    // typechecks, a validator built here is accepted by the forms engine with no adapter.
    const asFormsEngineSchema: FormsEngineStandardSchemaV1<{ name: string }> = validator;
    expect(asFormsEngineSchema['~standard'].version).toBe(1);

    const viaHelper: FormsEngineStandardSchemaV1<{ name: string }> = toStandardSchema(validator);
    expect(viaHelper['~standard'].vendor).toBe('wow-two-beta');
  });

  it('survives the REAL forms-engine runner, folded into field errors', () => {
    // End-to-end interop: `runStandardSchema` is the forms engine's own plumbing, untouched by this
    // slice. It reduces a spec result to the `path → messages` map a form renders.
    const nested = object({
      name: string().min(2),
      items: array(object({ qty: number().min(1) })),
    });

    expect(runStandardSchema(nested, { name: 'A', items: [{ qty: 0 }] })).toEqual({
      name: ['must be at least 2 characters'],
      'items[0].qty': ['must be at least 1'],
    });
    expect(runStandardSchema(nested, { name: 'Ann', items: [{ qty: 1 }] })).toEqual({});
  });
});

describe('assertValid and ValidationError', () => {
  const config = object({ port: number().integer().min(1), host: string().min(1) });

  it('returns the parsed value when valid', () => {
    expect(assertValid(config, { port: 8080, host: 'localhost' })).toEqual({
      port: 8080,
      host: 'localhost',
    });
  });

  it('throws a ValidationError carrying every issue', () => {
    let thrown: unknown;
    try {
      assertValid(config, { port: 0, host: '' });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ValidationError);
    expect(thrown).toBeInstanceOf(Error);
    const error = thrown as ValidationError;
    expect(error.name).toBe('ValidationError');
    expect(error.issues).toHaveLength(2);
    expect(error.issues.map((issue) => formatIssuePath(issue.path))).toEqual(['port', 'host']);
  });

  it('summarizes the first issue and counts the rest in the message', () => {
    expect(() => assertValid(config, { port: 0, host: '' })).toThrow(
      'Validation failed: port — must be at least 1 (+1 more)',
    );
    expect(() => assertValid(config, { port: 1, host: '' })).toThrow(
      'Validation failed: host — must be at least 1 character',
    );
  });

  it('omits the path for a root-level failure', () => {
    expect(() => assertValid(string(), 5)).toThrow('Validation failed: expected string, received number');
  });

  it('is the only member of this slice that throws', () => {
    expect(() => config.validate({ port: 0, host: '' })).not.toThrow();
  });
});

describe('hostile input', () => {
  it('does not throw on a circular object', () => {
    const circular: Record<string, unknown> = { name: 'ok' };
    circular['self'] = circular;

    // The walk follows the SCHEMA (finite), never the data, so a cycle terminates.
    expect(() => object({ name: string() }).validate(circular)).not.toThrow();
    expect(object({ name: string() }).validate(circular)).toEqual({ valid: true, value: { name: 'ok' } });

    expect(() => record(string()).validate(circular)).not.toThrow();
    expect(addressed(record(string()).validate(circular))).toEqual([
      ['self', 'expected string, received object'],
    ]);
  });

  it('does not throw on a Symbol', () => {
    // The trap: interpolating a symbol into a message (`${value}`) throws a TypeError. Messages name
    // the TYPE, never the value, so this stays total.
    expect(() => string().validate(Symbol('nope'))).not.toThrow();
    expect(addressed(string().validate(Symbol('nope')))).toEqual([
      ['', 'expected string, received symbol'],
    ]);
  });

  it('does not throw on NaN, Infinity, or a BigInt', () => {
    expect(() => number().validate(Number.NaN)).not.toThrow();
    expect(() => number().validate(Number.NEGATIVE_INFINITY)).not.toThrow();
    expect(() => number().validate(10n)).not.toThrow();
    expect(number().validate(10n).valid).toBe(false);
  });

  it('does not throw on a huge array', () => {
    const huge = Array.from({ length: 50_000 }, (_unused, index) => index);
    const result = array(number()).validate(huge);
    expect(result.valid).toBe(true);

    const mixed: unknown[] = [...huge];
    mixed[10] = 'bad';
    mixed[20] = 'bad';
    expect(addressed(array(number()).validate(mixed))).toEqual([
      ['[10]', 'expected number, received string'],
      ['[20]', 'expected number, received string'],
    ]);
  });

  it('does not throw on a property getter that throws', () => {
    const booby: Record<string, unknown> = {};
    Object.defineProperty(booby, 'name', {
      enumerable: true,
      get() {
        throw new Error('boom');
      },
    });

    expect(() => object({ name: string() }).validate(booby)).not.toThrow();
    expect(issuesOf(object({ name: string() }).validate(booby)).at(0)?.code).toBe('internal');
  });

  it('does not throw on a Proxy that traps getPrototypeOf', () => {
    const trapped = new Proxy(
      {},
      {
        getPrototypeOf() {
          throw new Error('nope');
        },
      },
    );

    expect(() => date().validate(trapped)).not.toThrow();
    expect(date().validate(trapped).valid).toBe(false);
    expect(() => describeType(trapped)).not.toThrow();
  });

  it('does not throw on null-prototype objects or exotic values', () => {
    const bare = Object.create(null) as Record<string, unknown>;
    bare['name'] = 'ok';
    expect(object({ name: string() }).validate(bare)).toEqual({ valid: true, value: { name: 'ok' } });

    expect(() => string().validate(() => undefined)).not.toThrow();
    expect(() => object({ a: string() }).validate(new Map())).not.toThrow();
    expect(() => array(string()).validate(new Set(['a']))).not.toThrow();
  });

  it('still throws from assertValid, which is the point of it', () => {
    expect(() => assertValid(string(), Symbol('nope'))).toThrow(ValidationError);
  });
});

const optionalString = string().optional();
const nullableString = string().nullable();
const defaultedString = string().optional().default('x');
const transformed = string().transform((value) => value.length);
const status = oneOf(['draft', 'live']);
const exact = literal('draft');
const mixedUnion = union([string(), number()]);
const stringList = array(string());
const numberRecord = record(number());
const pair = tuple([number(), string()]);
const person = object({ name: string(), age: number(), nickname: string().optional() });

describe('type inference', () => {
  // The `expectTypeOf` assertions are compile-time; `tsc --noEmit -p tsconfig.typecheck.json` includes
  // `tests/**`, so a narrowing regression fails the typecheck gate, not just this suite. Each fixture is
  // ALSO exercised at runtime here, so the inferred type and the produced value are checked together —
  // a type that narrows correctly while the runtime disagrees is the failure mode worth catching.
  it('narrows primitives and the modifier chain', () => {
    expectTypeOf<Infer<ReturnType<typeof string>>>().toEqualTypeOf<string>();
    expectTypeOf<Infer<ReturnType<typeof number>>>().toEqualTypeOf<number>();
    expectTypeOf<Infer<ReturnType<typeof boolean>>>().toEqualTypeOf<boolean>();
    expectTypeOf<Infer<ReturnType<typeof date>>>().toEqualTypeOf<Date>();

    expectTypeOf<Infer<typeof optionalString>>().toEqualTypeOf<string | undefined>();
    expectTypeOf<Infer<typeof nullableString>>().toEqualTypeOf<string | null>();
    expectTypeOf<Infer<typeof defaultedString>>().toEqualTypeOf<string>();
    expectTypeOf<Infer<typeof transformed>>().toEqualTypeOf<number>();

    expect(optionalString.validate(undefined)).toEqual({ valid: true, value: undefined });
    expect(nullableString.validate(null)).toEqual({ valid: true, value: null });
    expect(defaultedString.validate(undefined)).toEqual({ valid: true, value: 'x' });
    expect(transformed.validate('abcd')).toEqual({ valid: true, value: 4 });
  });

  it('narrows literals, unions, composites, and tuples', () => {
    expectTypeOf<Infer<typeof status>>().toEqualTypeOf<'draft' | 'live'>();
    expectTypeOf<Infer<typeof exact>>().toEqualTypeOf<'draft'>();
    expectTypeOf<Infer<typeof mixedUnion>>().toEqualTypeOf<string | number>();
    expectTypeOf<Infer<typeof stringList>>().toEqualTypeOf<string[]>();
    expectTypeOf<Infer<typeof numberRecord>>().toEqualTypeOf<Record<string, number>>();
    expectTypeOf<Infer<typeof pair>>().toEqualTypeOf<[number, string]>();
    expectTypeOf<Infer<typeof person>>().toEqualTypeOf<{ name: string; age: number; nickname?: string }>();

    expect(status.validate('draft')).toEqual({ valid: true, value: 'draft' });
    expect(exact.validate('draft')).toEqual({ valid: true, value: 'draft' });
    expect(mixedUnion.validate(7)).toEqual({ valid: true, value: 7 });
    expect(stringList.validate(['a'])).toEqual({ valid: true, value: ['a'] });
    expect(numberRecord.validate({ a: 1 })).toEqual({ valid: true, value: { a: 1 } });
    expect(pair.validate([1, 'a'])).toEqual({ valid: true, value: [1, 'a'] });

    // The runtime output matches the inferred type: an optional member is an optional PROPERTY.
    const parsed = person.validate({ name: 'Ann', age: 30 });
    expect(parsed.valid && parsed.value.nickname).toBeUndefined();
    expect(parsed.valid && 'nickname' in parsed.value).toBe(false);
  });

  it('keeps refinements on the subclass and widens only where documented', () => {
    // A refinement preserves the class, so the next type-specific method is still available.
    expectTypeOf(string().min(1)).toEqualTypeOf<ReturnType<typeof string>>();
    // `.transform()` intentionally returns the base class — output type changed.
    expectTypeOf(string().transform((value) => value.length)).toEqualTypeOf<Validator<number>>();
  });
});
