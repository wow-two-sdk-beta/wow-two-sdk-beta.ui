/*
 * Equality comparers — reusable helpers for selection components, diff checks,
 * and any place that asks "are these two values the same?".
 *
 * Default comparer is `Object.is` (NaN-safe strict equality) which covers
 * strings, numbers, booleans, symbols. For complex objects, consumers pass
 * their own comparer (typically `byKey(o => o.id)`).
 */

/** A function that decides whether two values are equal. */
export type EqualityComparer<T> = (a: T, b: T) => boolean;

export const Equality = {
  /**
   * Default. NaN-safe strict equality.
   * Correct for `string | number | boolean | symbol | null | undefined`.
   * Reference equality for objects (only same instance is equal).
   */
  strict: <T>(a: T, b: T): boolean => Object.is(a, b),

  /**
   * Plain `===` equality. Like `strict` but NaN !== NaN.
   * Use when you need pre-ES6 semantics; otherwise prefer `strict`.
   */
  reference: <T>(a: T, b: T): boolean => a === b,

  /**
   * Compare two objects by an extracted scalar key.
   *
   * @example
   *   keyEquals: Equality.byKey<User>(u => u.id)
   *   // → (a, b) => Object.is(a.id, b.id)
   */
  byKey:
    <T, K = unknown>(extract: (item: T) => K): EqualityComparer<T> =>
    (a, b) =>
      Object.is(extract(a), extract(b)),

  /**
   * Shallow object equality — equal iff every key has identical (Object.is) value.
   * Good for objects with primitive-only fields; doesn't recurse.
   */
  shallow: <T extends Record<string, unknown>>(a: T, b: T): boolean => {
    if (Object.is(a, b)) return true;
    if (a == null || b == null) return false;
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => Object.is(a[k], b[k]));
  },
} as const;
