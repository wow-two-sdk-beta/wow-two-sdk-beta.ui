/**
 * Structural equality over form-value shapes — primitives, plain objects, arrays,
 * `Date`, and `File` / `Blob` (upload fields). Powers dirty tracking (values vs the
 * reset baseline), so it only needs to cover what form values hold; exotic types fall
 * back to `Object.is`. (`foundation/utils` `Equality` is shallow-only, hence the local
 * deep variant.)
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  // `File`/`Blob` have no enumerable keys, so the plain-object branch would treat any two
  // as equal and a file-swap would never re-flip dirty. Compare `File` by its identifying
  // metadata (name / size / lastModified / type); a `Blob` carries none, so identity only
  // (`Object.is` above already returned for the same ref). `File extends Blob` → check first.
  if (typeof File !== 'undefined' && (a instanceof File || b instanceof File)) {
    return (
      a instanceof File &&
      b instanceof File &&
      a.name === b.name &&
      a.size === b.size &&
      a.lastModified === b.lastModified &&
      a.type === b.type
    );
  }
  if (typeof Blob !== 'undefined' && (a instanceof Blob || b instanceof Blob)) {
    // A bare `Blob` carries no name/lastModified — identity is the only safe signal, and
    // `Object.is` above already returned for the same ref, so distinct refs read as changed
    // (a missed dirty is worse than a spurious one for an upload field).
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    );
  }
  return false;
}
