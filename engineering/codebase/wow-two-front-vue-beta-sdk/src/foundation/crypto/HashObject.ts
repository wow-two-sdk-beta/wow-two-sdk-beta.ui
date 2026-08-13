// Stable content hashing for arbitrary values — the "cache key from a params object" primitive.
//
// `JSON.stringify` is not usable for this directly: it emits keys in insertion order, so `{a:1,b:2}` and
// `{b:2,a:1}` produce different strings and therefore different keys. Two call sites that build the same
// query with their properties written in a different order then miss each other's cache entry forever. The
// bug is invisible locally (one call site, one order) and shows up as a mysteriously low hit rate.
//
// So the value is rewritten into a canonical form first — object keys sorted at every depth, array order
// preserved (order is semantic in an array, incidental in an object) — and only then stringified and
// hashed.
//
// Behaviours that follow from delegating to `JSON.stringify`, documented rather than papered over:
//  - `toJSON()` is honoured before sorting, so a `Date`/`Temporal` value canonicalizes to its ISO string
//    instead of collapsing to `{}` the way a blind `Object.keys` walk would leave it.
//  - `undefined`, functions, and symbol values disappear from objects; `Map`/`Set` hash as `{}`. Feed
//    plain data, or map those types yourself before hashing.
//  - A circular reference throws a `TypeError`. The same object appearing twice in a DAG is fine — only a
//    true cycle is rejected — because the guard is unwound on the way back out.
//
// `hashObject` is async and needs `crypto.subtle` (see `WebCrypto.ts`). `stableStringify` is pure and works
// anywhere, and is exported in its own right: it is often all a caller needs for an in-memory `Map` key,
// where the digest is pure overhead.

import { sha256Hex } from './Digest';

/** Recursively canonicalizes a value: `toJSON` first, arrays in order, object keys sorted. `seen` rejects cycles. */
function canonicalize(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') return value;

  // Checked before the object is registered, so a `toJSON` that returns its own receiver terminates here
  // rather than recursing forever.
  if (seen.has(value)) {
    throw new TypeError('stableStringify: circular reference — a value cannot contain itself.');
  }

  seen.add(value);

  const canonical = canonicalizeObject(value, seen);

  // Unwound so a repeated (but non-cyclic) reference stays legal.
  seen.delete(value);

  return canonical;
}

/** Canonicalizes the object cases of {@link canonicalize}, with `value` already registered in `seen`. */
function canonicalizeObject(value: object, seen: WeakSet<object>): unknown {
  const serializable = value as { toJSON?: () => unknown };
  if (typeof serializable.toJSON === 'function') {
    return canonicalize(serializable.toJSON(), seen);
  }

  if (Array.isArray(value)) {
    return value.map((item: unknown) => canonicalize(item, seen));
  }

  const record = value as Record<string, unknown>;

  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key): [string, unknown] => [key, canonicalize(record[key], seen)]),
  );
}

/**
 * Serializes `value` to JSON with object keys sorted at every depth, so two structurally equal values
 * always produce the same string regardless of property insertion order. Array order is preserved.
 *
 * Pure and synchronous — usable under SSR and as an in-memory `Map` key without hashing. Returns the
 * literal `'undefined'` for an input `JSON.stringify` would drop entirely (`undefined`, a function, a
 * symbol), so the result is always a string. **Throws a `TypeError`** on a circular reference.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value, new WeakSet())) ?? 'undefined';
}

/**
 * Hashes any JSON-serializable value to a lowercase 64-char SHA-256 hex string, order-independently:
 * `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` produce the same hash at any nesting depth. The canonical cache key
 * for a params object, a filter set, or a request body.
 *
 * Async and requires a secure context — see {@link stableStringify} for the pure, sync alternative, and
 * `isSubtleAvailable()` to probe before calling.
 */
export function hashObject(value: unknown): Promise<string> {
  return sha256Hex(stableStringify(value));
}
