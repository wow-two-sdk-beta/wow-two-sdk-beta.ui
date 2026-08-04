// Result + issue vocabulary for the validation slice. Deliberately TOTAL: a validator returns a result
// and never throws, so a caller can check a config value, a URL param, or an API payload without a
// try/catch, and can render every problem at once instead of only the first one. `assertValid` in
// `ValidationError.ts` is the single opt-in escape hatch for callers that genuinely want a throw.
//
// WHY `path` IS AN ARRAY, NOT A DOTTED STRING: the segments stay machine-readable — a form keys a field
// by `['items', 0, 'name']`, a table highlights row 0 — and `formatIssuePath` renders the display form on
// demand. It also matches Standard Schema's `Issue.path` (segments are `PropertyKey`s), so the bridge in
// `Validator.ts` hands them over unchanged instead of re-encoding.
//
// WHY MESSAGES NAME THE RECEIVED *TYPE*, NEVER THE RECEIVED VALUE: interpolating a hostile value into a
// message is a live footgun. `${aSymbol}` throws a TypeError, a `Proxy` can trap `toString` and throw or
// leak, and echoing a rejected password or token into an error string ships a secret straight to the logs.
// So `describeType` is the only thing that ever reaches a message.

/** A single segment of an issue path — an object key or an array index. */
export type PathSegmentKey = string | number;

/** One reason a value was rejected, addressed at the exact spot it failed. */
export interface ValidationIssue {
  /** Location of the failure relative to the validated root: `['items', 0, 'name']`. Empty at the root. */
  readonly path: readonly PathSegmentKey[];

  /** Human-readable, display-ready explanation of the failure. Never contains the rejected value. */
  readonly message: string;

  /** Stable machine tag for the rule that failed (`type`, `min`, `pattern`, `union`, `custom`, …). */
  readonly code?: string;

  /**
   * The rule's own operands — `{ min: 2, unit: 'characters' }` for `string().min(2)`.
   *
   * Present so a message CATALOGUE can re-render the failure in another voice or another language
   * (`Messages.ts`). `message` already reads correctly on its own; without the operands beside it, a
   * catalogue could only ever emit parameterless text, which is a catalogue that cannot replace the
   * message it exists to replace. Holds operands only — never the rejected value, for the same reason
   * `describeType` exists.
   */
  readonly params?: Readonly<Record<string, unknown>>;
}

/** The outcome of validating a value: the parsed output, or every issue found. Never a thrown error. */
export type ValidationResult<T> =
  | {
      /** Discriminant: the value satisfied the validator. */
      readonly valid: true;
      /** The parsed output, after any `.default()` fallback and `.transform()` mapping. */
      readonly value: T;
    }
  | {
      /** Discriminant: the value was rejected. */
      readonly valid: false;
      /** Every issue found, in traversal order — not just the first. */
      readonly issues: readonly ValidationIssue[];
    };

/** Builds a success result carrying the parsed (and possibly transformed) output. */
export function valid<T>(value: T): ValidationResult<T> {
  return { valid: true, value };
}

/** Builds a failure result from the issues collected during the traversal. */
export function invalid<T>(issues: readonly ValidationIssue[]): ValidationResult<T> {
  return { valid: false, issues };
}

/**
 * Names a value's type for an error message. Total and hostile-input safe: a `Proxy` may trap
 * `getPrototypeOf` (which `instanceof` calls) and throw, so the object probes are guarded — a message
 * is never worth a second failure. `NaN` reports as `NaN` rather than `number`, since "expected number,
 * received number" reads as a bug.
 */
export function describeType(value: unknown): string {
  if (value === null) return 'null';

  const kind = typeof value;
  if (kind !== 'object') {
    return kind === 'number' && Number.isNaN(value) ? 'NaN' : kind;
  }

  try {
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'Date';
  } catch {
    // A trapped prototype read threw — fall through to the generic label.
  }
  return 'object';
}

/**
 * Renders an issue path in the familiar display form: `['items', 0, 'name']` → `items[0].name`.
 * A root-level issue (empty path) renders as the empty string — callers decide how to label the root.
 */
export function formatIssuePath(path: readonly PathSegmentKey[]): string {
  let rendered = '';
  for (const segment of path) {
    if (typeof segment === 'number') rendered += `[${segment}]`;
    else if (rendered === '') rendered = segment;
    else rendered += `.${segment}`;
  }
  return rendered;
}
