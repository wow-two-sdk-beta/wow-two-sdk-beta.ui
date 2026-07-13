import { formatPath, type PathKey } from './Paths';
import type { StandardSchemaV1 } from './StandardSchema';

/*
 * Whole-schema Standard Schema plumbing: run `schema['~standard'].validate` over the
 * form values and normalize failure issues to a `path → messages` map keyed by the
 * same loose string paths fields use. Root-level issues (no path) key under `''` —
 * they hold `isValid` false even though no field renders them.
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
 */
export function runStandardSchema<TValues extends object>(
  schema: StandardSchemaV1<TValues>,
  values: TValues,
): Record<string, string[]> | Promise<Record<string, string[]>> {
  const outcome = schema['~standard'].validate(values);
  if (isThenable(outcome)) {
    return Promise.resolve(outcome).then(resultToFieldErrors);
  }
  return resultToFieldErrors(outcome);
}
