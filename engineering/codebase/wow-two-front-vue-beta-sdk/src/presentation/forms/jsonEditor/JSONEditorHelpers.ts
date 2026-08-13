/* Internal helpers for the JSON editor subviews — not exported from the folder barrel,
   exactly as they were module-private functions inside React's single `JSONEditor.tsx`. */

/** Addresses a node inside the edited document. */
export type JsonPath = Array<string | number>;

export function describeType(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

export function pathToString(path: JsonPath): string {
  return path.map((p, i) => (typeof p === 'number' ? `[${p}]` : i === 0 ? p : `.${p}`)).join('');
}

export function setAtPath(root: unknown, path: JsonPath, next: unknown): unknown {
  if (path.length === 0) return next;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const idx = head as number;
    const copy = root.slice();
    copy[idx] = setAtPath(root[idx], rest, next);
    return copy;
  }
  if (root && typeof root === 'object') {
    const key = head as string;
    return {
      ...(root as Record<string, unknown>),
      [key]: setAtPath((root as Record<string, unknown>)[key], rest, next),
    };
  }
  return root;
}

export function safeStringify(value: unknown, indent: number): string {
  try {
    return JSON.stringify(value, null, indent);
  } catch {
    return '';
  }
}
