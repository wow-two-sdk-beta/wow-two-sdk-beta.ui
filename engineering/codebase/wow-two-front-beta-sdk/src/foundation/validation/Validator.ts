// The one validator type every builder in this slice returns, and the Standard Schema bridge that makes
// it portable. A `Validator<T>` is a `typeName` plus a total parse function; the chain methods never
// mutate — each returns a NEW validator wrapping the previous one, so a validator can be shared and
// re-derived freely.
//
// STANDARD-SCHEMA-COMPATIBLE BY CONSTRUCTION: every instance exposes `['~standard']` in its constructor,
// so any validator built here drops straight into `forms-engine` (`AppFormOptions.schema`) or into any
// other Standard Schema consumer with no adapter and no wrapper. That is the point of the slice — the
// forms engine already speaks the spec, but the spec type lived above `foundation`, so nothing below it
// could produce one. `toStandardSchema` exists only for callers who prefer a bare spec object.
//
// WHY THE SPEC `Input` IS `TOutput`, NOT `unknown`: the spec's `Props<Input, Output>` carries `Input`
// only through the optional phantom `types`, and consumers spell the schema slot with the ONE-ARG form —
// `AppFormOptions.schema?: StandardSchemaV1<TValues>`, which expands to `Props<TValues, TValues>`. A
// validator declaring `Input = unknown` fails that assignment, because `types?: Types<unknown, T>` is not
// assignable to `types?: Types<T, T>`. Declaring `Input = TOutput` is what makes "drops in unchanged"
// literally true. The cost is that a `.transform()` chain reports its INPUT type as the transformed
// output; this slice does not track input types, `types` is never populated at runtime, and `validate`
// still accepts `unknown` — so the inaccuracy is confined to `InferInput`, which no consumer here reads.
//
// WHY `derive` REBUILDS `this.constructor`: refinements must preserve the SUBCLASS, or the chain collapses
// — `string().min(2)` returning a base `Validator<string>` would lose `.pattern()`. Every subclass keeps
// the base `(typeName, parseFn)` constructor signature so the same class can be rebuilt with an extra check.
//
// WHY THE PHANTOM `__output`: `Infer<V>` reads the output type back out of a validator. A phantom field
// pins `TOutput` in a plain covariant position, making the inference reliable regardless of how the type
// appears in method signatures. It is `declare`-only — it emits no runtime code and is never read.
//
// TOTALITY IS A HARD CONTRACT: `parseAt` wraps the parse function in a last-resort catch. A caller-supplied
// check (`.refine`), mapper (`.transform`), or getter on the validated object can throw; a validator still
// reports that as an issue rather than propagating it, because every call site here is written on the
// promise that validation does not throw.

import type { StandardSchemaV1 } from './StandardSchema';
import {
  invalid,
  valid,
  type PathSegmentKey,
  type ValidationResult,
} from './ValidationResult';

/** Parses an unknown value sitting at `path` inside the validated structure. Must not throw. */
export type ParseFn<TOutput> = (
  value: unknown,
  path: readonly PathSegmentKey[],
) => ValidationResult<TOutput>;

/** The `vendor` reported by every validator's Standard Schema props. */
export const VALIDATION_VENDOR = 'wow-two-beta';

/** Shared root path — frozen because issues hold it by reference. */
const ROOT_PATH: readonly PathSegmentKey[] = Object.freeze([]);

/** Extracts the output type of a validator: `Infer<typeof user>` → `{ name: string }`. */
export type Infer<TValidator> = TValidator extends Validator<infer TOutput> ? TOutput : never;

/** Converts a slice result into the Standard Schema result shape (`{ value }` or `{ issues }`). */
export function toStandardResult<TOutput>(
  result: ValidationResult<TOutput>,
): StandardSchemaV1.Result<TOutput> {
  if (result.valid) return { value: result.value };
  // Spec issues carry `message` + `path` only; `code` is ours and has no spec slot, so it is dropped
  // here rather than smuggled in — a consumer that wants codes reads `validate()` directly.
  return { issues: result.issues.map((issue) => ({ message: issue.message, path: issue.path })) };
}

/**
 * A total, composable validator for one shape of value. Build one with `string()`, `object({…})`, etc.
 * rather than constructing it directly; the constructor is public only so a caller can define a
 * validator this slice does not ship.
 */
export class Validator<TOutput> implements StandardSchemaV1<TOutput, TOutput> {
  /** Phantom carrier for `Infer`. Never assigned, never read — erased at compile time. */
  declare readonly __output: TOutput;

  /** Human-facing name of the accepted shape, used in messages and in composite type names. */
  readonly typeName: string;

  /** Standard Schema props — lets this validator be handed to any spec consumer unchanged. */
  readonly '~standard': StandardSchemaV1.Props<TOutput, TOutput>;

  /** The total parse function this validator wraps. */
  protected readonly parseFn: ParseFn<TOutput>;

  /** Wraps a parse function under a display name. Prefer the builders (`string()`, `object()`, …). */
  constructor(typeName: string, parseFn: ParseFn<TOutput>) {
    this.typeName = typeName;
    this.parseFn = parseFn;
    this['~standard'] = {
      version: 1,
      vendor: VALIDATION_VENDOR,
      // Always synchronous — the spec allows a promise, this slice never needs one, and staying sync
      // means a form gets its errors in the same tick as the change that caused them.
      validate: (value: unknown) => toStandardResult(this.validate(value)),
    };
  }

  /** Validates `value` from the root. Total — returns a result, never throws. */
  validate(value: unknown): ValidationResult<TOutput> {
    return this.parseAt(value, ROOT_PATH);
  }

  /**
   * Validates `value` as if it sat at `path` inside a larger structure, so nested issues carry their
   * full address. Composites call this to thread the path; prefer `validate` at ordinary call sites.
   */
  parseAt(value: unknown, path: readonly PathSegmentKey[]): ValidationResult<TOutput> {
    try {
      return this.parseFn(value, path);
    } catch {
      // Last-resort net for a throwing caller-supplied check or a trapped property read. The thrown
      // value is deliberately not interpolated: it may be hostile, and reading it could throw again.
      return invalid([{ path, message: `${this.typeName} check failed unexpectedly`, code: 'internal' }]);
    }
  }

  /** Accepts `undefined` as-is; any other value must satisfy this validator. Widens to `TOutput | undefined`. */
  optional(): Validator<TOutput | undefined> {
    return new Validator<TOutput | undefined>(`${this.typeName} | undefined`, (value, path) =>
      value === undefined ? valid(undefined) : this.parseAt(value, path),
    );
  }

  /** Accepts `null` as-is; any other value must satisfy this validator. Widens to `TOutput | null`. */
  nullable(): Validator<TOutput | null> {
    return new Validator<TOutput | null>(`${this.typeName} | null`, (value, path) =>
      value === null ? valid(null) : this.parseAt(value, path),
    );
  }

  /**
   * Substitutes `fallback` when the value is `undefined`, narrowing the output back to a defined type.
   *
   * `null` is NOT defaulted. An explicit `null` is a value the caller chose — in a JSON payload it means
   * "known to be empty", which is different from "absent" — so it keeps flowing into this validator and
   * is rejected unless the validator is also `.nullable()`. Matches zod's split.
   */
  default(fallback: Exclude<TOutput, undefined>): Validator<Exclude<TOutput, undefined>> {
    return new Validator<Exclude<TOutput, undefined>>(`${this.typeName} (default)`, (value, path) => {
      if (value === undefined) return valid(fallback);

      const result = this.parseAt(value, path);
      if (!result.valid) return result;

      // The inner validator can still yield `undefined` (a `.transform` that returns it), which the
      // fallback also covers — so the narrowing cast holds for every path that reaches here.
      return valid((result.value === undefined ? fallback : result.value) as Exclude<TOutput, undefined>);
    });
  }

  /**
   * Adds a custom check that runs only after this validator accepts the value, so `check` always sees a
   * fully parsed `TOutput`. Returns the same validator class, keeping type-specific methods chainable.
   * A `check` that throws is reported as this same failure rather than propagating.
   */
  refine(check: (value: TOutput) => boolean, message: string, code = 'custom'): this {
    return this.derive((value, path) => {
      const result = this.parseAt(value, path);
      if (!result.valid) return result;

      let passed: boolean;
      try {
        passed = check(result.value);
      } catch {
        passed = false;
      }
      return passed ? result : invalid([{ path, message, code }]);
    });
  }

  /**
   * Maps the parsed value to another shape. Runs strictly AFTER validation, so `map` receives a valid
   * `TOutput`. A `map` that throws becomes an issue, preserving totality. The result is a base
   * `Validator<TNext>` — type-specific methods do not survive a change of output type.
   */
  transform<TNext>(map: (value: TOutput) => TNext): Validator<TNext> {
    return new Validator<TNext>(this.typeName, (value, path) => {
      const result = this.parseAt(value, path);
      if (!result.valid) return result;

      try {
        return valid(map(result.value));
      } catch {
        return invalid([
          { path, message: `could not be converted from ${this.typeName}`, code: 'transform' },
        ]);
      }
    });
  }

  /** Rebuilds this validator's own class around a new parse function, keeping the chain's static type. */
  protected derive(parseFn: ParseFn<TOutput>): this {
    const Ctor = this.constructor as new (typeName: string, parseFn: ParseFn<TOutput>) => this;
    return new Ctor(this.typeName, parseFn);
  }
}

/**
 * Presents a validator as a bare Standard Schema object. Every validator already implements the spec —
 * this is sugar for a call site that reads better handing over a plain `{ '~standard': … }` than the
 * whole validator (and for narrowing the surface a consumer sees).
 */
export function toStandardSchema<TOutput>(
  validator: Validator<TOutput>,
): StandardSchemaV1<TOutput, TOutput> {
  return { '~standard': validator['~standard'] };
}
