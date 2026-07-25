// Scalar validators and their type-specific refinements. Each builder returns a SUBCLASS of `Validator`
// so that `.min()` means the right thing per type — characters for a string, magnitude for a number,
// instant for a date — instead of one loose method that typechecks everywhere and is wrong somewhere.
// The shared chain (`.optional()`, `.nullable()`, `.default()`, `.refine()`, `.transform()`) lives on the
// base class; refinements return `this`, so `string().min(2).pattern(/x/)` stays a `StringValidator`.
//
// STRICT, NOT COERCING: `number()` rejects the string `"42"`, `date()` rejects an ISO string. Silent
// coercion is how a validated boundary starts lying — `Number("")` is `0`, `new Date("nonsense")` is an
// Invalid Date object that passes an `instanceof` check. A caller who wants coercion asks for it
// explicitly with `.transform()`, which is visible at the call site.
//
// `number()` ALSO REJECTS `NaN` AND `Infinity`: both are `typeof 'number'` and both poison every
// downstream comparison, so a "valid number" that fails `x > 0` and `x <= 0` alike is not one.

import {
  describeType,
  invalid,
  valid,
  type ValidationResult,
} from './ValidationResult';
import { Validator } from './Validator';

/** A validator for `string` values, carrying the string-specific refinements. */
export class StringValidator extends Validator<string> {
  /** Requires at least `limit` characters (UTF-16 code units, matching `String.length`). */
  min(limit: number, message?: string): this {
    return this.refine(
      (value) => value.length >= limit,
      message ?? `must be at least ${limit} character${limit === 1 ? '' : 's'}`,
      'min',
    );
  }

  /** Requires at most `limit` characters. */
  max(limit: number, message?: string): this {
    return this.refine(
      (value) => value.length <= limit,
      message ?? `must be at most ${limit} character${limit === 1 ? '' : 's'}`,
      'max',
    );
  }

  /** Requires exactly `exact` characters. */
  length(exact: number, message?: string): this {
    return this.refine(
      (value) => value.length === exact,
      message ?? `must be exactly ${exact} character${exact === 1 ? '' : 's'}`,
      'length',
    );
  }

  /**
   * Requires the value to match `regex`.
   *
   * A `g` or `y` regex carries `lastIndex` between calls, so testing the same input twice alternates
   * pass and fail — a validator that is stateful is a bug generator. Those flags are stripped from a
   * private clone; the caller's regex is never mutated.
   */
  pattern(regex: RegExp, message?: string, code = 'pattern'): this {
    const stateless =
      regex.global || regex.sticky
        ? new RegExp(regex.source, regex.flags.replace(/[gy]/g, ''))
        : regex;
    return this.refine(
      (value) => stateless.test(value),
      message ?? `must match ${String(stateless)}`,
      code,
    );
  }
}

/** A validator for finite `number` values, carrying the numeric refinements. */
export class NumberValidator extends Validator<number> {
  /** Requires a value greater than or equal to `limit`. */
  min(limit: number, message?: string): this {
    return this.refine((value) => value >= limit, message ?? `must be at least ${limit}`, 'min');
  }

  /** Requires a value less than or equal to `limit`. */
  max(limit: number, message?: string): this {
    return this.refine((value) => value <= limit, message ?? `must be at most ${limit}`, 'max');
  }

  /** Requires a whole number — rejects any fractional part. */
  integer(message?: string): this {
    return this.refine(Number.isInteger, message ?? 'must be a whole number', 'integer');
  }
}

/** A validator for valid `Date` instances, carrying the chronological refinements. */
export class DateValidator extends Validator<Date> {
  /** Requires an instant at or after `limit`. */
  min(limit: Date, message?: string): this {
    return this.refine(
      (value) => value.getTime() >= limit.getTime(),
      message ?? `must be on or after ${limit.toISOString()}`,
      'min',
    );
  }

  /** Requires an instant at or before `limit`. */
  max(limit: Date, message?: string): this {
    return this.refine(
      (value) => value.getTime() <= limit.getTime(),
      message ?? `must be on or before ${limit.toISOString()}`,
      'max',
    );
  }
}

/** Accepts any `string`. Chain `.min()`, `.max()`, `.length()`, or `.pattern()` to constrain it. */
export function string(message?: string): StringValidator {
  return new StringValidator('string', (value, path) =>
    typeof value === 'string'
      ? valid(value)
      : invalid([
          { path, message: message ?? `expected string, received ${describeType(value)}`, code: 'type' },
        ]),
  );
}

/** Accepts any finite `number` — rejects `NaN` and `±Infinity`, which break every downstream comparison. */
export function number(message?: string): NumberValidator {
  return new NumberValidator('number', (value, path) =>
    typeof value === 'number' && Number.isFinite(value)
      ? valid(value)
      : invalid([
          { path, message: message ?? `expected number, received ${describeType(value)}`, code: 'type' },
        ]),
  );
}

/** Accepts `true` or `false`. Rejects the strings `"true"` / `"false"` — see the no-coercion note. */
export function boolean(message?: string): Validator<boolean> {
  return new Validator<boolean>('boolean', (value, path) =>
    typeof value === 'boolean'
      ? valid(value)
      : invalid([
          { path, message: message ?? `expected boolean, received ${describeType(value)}`, code: 'type' },
        ]),
  );
}

/**
 * Accepts a `Date` instance holding a real instant. An Invalid Date (`new Date('nonsense')`) is still a
 * `Date` and still passes `instanceof`, so its time value is checked too. Use `isoDate()` for strings.
 */
export function date(message?: string): DateValidator {
  return new DateValidator('Date', (value, path) =>
    value instanceof Date && !Number.isNaN(value.getTime())
      ? valid(value)
      : invalid([
          { path, message: message ?? `expected Date, received ${describeType(value)}`, code: 'type' },
        ]),
  );
}

/** Accepts exactly `expected`, compared by `===`. The output narrows to the literal type. */
export function literal<const TValue extends string | number | boolean | null>(
  expected: TValue,
  message?: string,
): Validator<TValue> {
  const label = expected === null ? 'null' : JSON.stringify(expected);
  return new Validator<TValue>(`literal ${label}`, (value, path) =>
    value === expected
      ? valid(expected)
      : invalid([{ path, message: message ?? `must be ${label}`, code: 'literal' }]),
  );
}

/** Accepts any member of `values`, compared by `===`. The output narrows to the union of the literals. */
export function oneOf<const TValues extends readonly (string | number | boolean)[]>(
  values: TValues,
  message?: string,
): Validator<TValues[number]> {
  const label = values.map((value) => String(value)).join(', ');
  return new Validator<TValues[number]>(`one of [${label}]`, (value, path): ValidationResult<TValues[number]> =>
    (values as readonly unknown[]).includes(value)
      ? valid(value as TValues[number])
      : invalid([{ path, message: message ?? `must be one of: ${label}`, code: 'oneOf' }]),
  );
}
