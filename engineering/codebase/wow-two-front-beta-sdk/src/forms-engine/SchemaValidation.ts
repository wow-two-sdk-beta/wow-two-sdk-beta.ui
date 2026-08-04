import {
  createMessageResolver,
  type ResolveValidationMessage,
  type ValidationMessageCatalogue,
  type ValidationResult,
} from '../foundation/validation';

import { formatPath, type PathKey } from './Paths';
import type { StandardSchemaV1 } from './StandardSchema';

/*
 * Whole-schema Standard Schema plumbing: run `schema['~standard'].validate` over the
 * form values and normalize failure issues to a `path → messages` map keyed by the
 * same loose string paths fields use. Root-level issues (no path) key under `''` —
 * they hold `isValid` false even though no field renders them.
 *
 * THE SPEC HAS NO SLOT FOR A RULE CODE. `StandardSchemaV1.Issue` is `{ message, path }`, so a schema's
 * machine tags are erased the moment it is read through the spec — including our own validators', which
 * carry one on every issue. That erasure is why the client could not render from a message catalogue
 * (`foundation/validation/Messages.ts`) even though the codes existed all along.
 *
 * SO A HOUSE VALIDATOR IS READ NATIVELY. When the schema reports our vendor, `validate()` is called
 * directly for the un-erased result, and its codes reach the catalogue. Detection is a string compare on
 * `['~standard'].vendor` plus a shape probe — deliberately NOT an `instanceof Validator`, which would
 * pull the validator slice's runtime into this bundle for every consumer, including the ones on zod.
 * A third-party spec schema takes the plain path and renders its own messages, exactly as before.
 */

/** Normalizes a spec issue path (`PropertyKey | { key }` segments) to the canonical string form. */
export function issuePathToString(path: StandardSchemaV1.Issue['path']): string {
  if (!path || path.length === 0) return '';
  const segments: PathKey[] = path.map((segment) => {
    const key = typeof segment === 'object' && segment !== null && 'key' in segment ? segment.key : segment;
    return typeof key === 'number' ? key : String(key);
  });
  return formatPath(segments);
}

/** Folds failure issues into `path → messages`; a success result yields `{}`. */
export function resultToFieldErrors(result: StandardSchemaV1.Result<unknown>): Record<string, string[]> {
  if (!result.issues) return {};
  const errors: Record<string, string[]> = {};
  for (const issue of result.issues) {
    const path = issuePathToString(issue.path);
    (errors[path] ??= []).push(issue.message);
  }
  return errors;
}

/** The vendor every `foundation/validation` validator reports — mirrored, not imported, to keep this file runtime-free of that slice. */
const HOUSE_VENDOR = 'wow-two-beta';

/** The native surface a house validator adds to the spec — the un-erased, code-carrying result. */
interface NativeValidator {
  readonly validate: (value: unknown) => ValidationResult<unknown>;
}

/** Detects a house validator by its reported vendor plus the native `validate` it adds to the spec. */
function asNativeValidator(schema: StandardSchemaV1<object>): NativeValidator | null {
  if (schema['~standard'].vendor !== HOUSE_VENDOR) return null;
  const candidate = schema as unknown as Partial<NativeValidator>;
  return typeof candidate.validate === 'function' ? (candidate as NativeValidator) : null;
}

/** Folds a native house result into `path → messages`, rendering each issue through the catalogue. */
function nativeResultToFieldErrors(
  result: ValidationResult<unknown>,
  resolveMessage?: ResolveValidationMessage,
): Record<string, string[]> {
  if (result.valid) return {};
  const errors: Record<string, string[]> = {};
  for (const issue of result.issues) {
    const path = formatPath(issue.path as readonly PathKey[]);
    const message = resolveMessage
      ? resolveMessage({ message: issue.message, code: issue.code, params: issue.params }, path)
      : issue.message;
    (errors[path] ??= []).push(message);
  }
  return errors;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

/**
 * Validates `values` against a Standard Schema. Sync schemas resolve synchronously
 * (no promise tick between a change and its errors); async schemas return a promise —
 * the engine's `isValidating` covers them.
 *
 * `resolveMessage` renders a house validator's issues through the form's message catalogue; it has no
 * effect on a third-party spec schema, whose codes the spec already erased.
 */
export function runStandardSchema<TValues extends object>(
  schema: StandardSchemaV1<TValues>,
  values: TValues,
  resolveMessage?: ResolveValidationMessage,
): Record<string, string[]> | Promise<Record<string, string[]>> {
  const native = asNativeValidator(schema);
  // House validators are always synchronous (`Validator.ts` — a form gets its errors in the same tick
  // as the change that caused them), so this arm never needs the promise branch below.
  if (native) return nativeResultToFieldErrors(native.validate(values), resolveMessage);

  const outcome = schema['~standard'].validate(values);
  if (isThenable(outcome)) {
    return Promise.resolve(outcome).then(resultToFieldErrors);
  }
  return resultToFieldErrors(outcome);
}

/** The options an adapter reads a message resolver from — the `messages` / `labels` cluster alone. */
interface MessageOptions {
  readonly messages?: ValidationMessageCatalogue;
  readonly labels?: Readonly<Record<string, string>>;
}

/**
 * Memoizes the form's message resolver against the identity of its `messages` / `labels` options —
 * an adapter calls this on every validation run and every submit failure, and `createMessageResolver`
 * merges a table over the defaults each time it is called. Shared by both in-repo adapters; an
 * adapter author wanting the catalogue wires this once and passes the result to `runStandardSchema` and
 * `resolveSubmitFailure`.
 */
export function createOptionsMessageResolver(
  getOptions: () => MessageOptions,
): () => ResolveValidationMessage {
  let resolver: ResolveValidationMessage | null = null;
  let lastMessages: ValidationMessageCatalogue | undefined;
  let lastLabels: Readonly<Record<string, string>> | undefined;

  return () => {
    const { messages, labels } = getOptions();
    if (resolver === null || messages !== lastMessages || labels !== lastLabels) {
      lastMessages = messages;
      lastLabels = labels;
      resolver = createMessageResolver(messages, labels);
    }
    return resolver;
  };
}
