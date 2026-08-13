// Capability detection — the four questions a UI asks BEFORE it renders a clipboard affordance, plus the two
// guarded global reads every other module in the slice goes through.
//
// Per-method, not per-API. `navigator.clipboard` existing tells you almost nothing: Firefox exposes the object
// and `writeText` on it while withholding `readText` from page script entirely, and every engine shipped
// `writeText` years before `write`. So each predicate probes the exact method its operation calls, and the
// modules never touch `navigator.clipboard` directly.
//
// Every read is wrapped: `navigator` can be absent (SSR), a getter can throw (a hardened page, an over-eager
// polyfill), and a partial implementation can leave a property that is not a function. All of those have to
// become `false`, never an exception — a feature check that throws is worse than no feature check.
//
// `ClipboardItem` is read off `globalThis` rather than referenced as a bare global for the same reason: it is
// undefined in Node and in older Safari, and a bare reference would be a `ReferenceError` instead of a `false`.

/** The `ClipboardItem` constructor, narrowed to the one overload this slice calls. */
export type ClipboardItemConstructor = new (items: Record<string, Blob>) => ClipboardItem;

/** Reads a member off an object, guarded — a throwing getter reads as `undefined`. */
function member(source: object, key: string): unknown {
  try {
    return (source as Record<string, unknown>)[key];
  } catch {
    return undefined;
  }
}

/**
 * Reads `navigator.clipboard` if it is there and usable. Guarded end-to-end; returns `undefined` under SSR.
 * Exported for the sibling modules; absent from the barrel.
 */
export function clipboardApi(): Clipboard | undefined {
  try {
    if (typeof navigator === 'undefined') return undefined;
    const clipboard = member(navigator, 'clipboard');
    if (typeof clipboard !== 'object' || clipboard === null) return undefined;
    return clipboard as Clipboard;
  } catch {
    return undefined;
  }
}

/** The Clipboard API methods this slice calls. */
export type ClipboardMethodName = 'writeText' | 'write' | 'readText' | 'read';

/**
 * Resolves one of the Clipboard API's methods, bound to the clipboard object, or `undefined` when this engine
 * does not implement it. The single gate every operation passes through. Exported for the sibling modules;
 * absent from the barrel.
 *
 * Bound rather than returned bare: a caller invoking a detached `writeText` would lose its receiver and get a
 * `TypeError` ("Illegal invocation") from the real implementation.
 *
 * @param name The method to resolve — `writeText`, `write`, `readText`, or `read`.
 */
export function clipboardMethod<TName extends ClipboardMethodName>(name: TName): Clipboard[TName] | undefined {
  const clipboard = clipboardApi();
  if (clipboard === undefined) return undefined;

  const method = member(clipboard, name);
  if (typeof method !== 'function') return undefined;

  try {
    return (method as (...args: unknown[]) => unknown).bind(clipboard) as Clipboard[TName];
  } catch {
    return undefined;
  }
}

/**
 * Reads the `ClipboardItem` constructor, which multi-format writes need and which Node and older Safari lack.
 * Exported for the sibling modules; absent from the barrel.
 */
export function clipboardItemConstructor(): ClipboardItemConstructor | undefined {
  try {
    const constructor = member(globalThis, 'ClipboardItem');
    if (typeof constructor !== 'function') return undefined;
    return constructor as ClipboardItemConstructor;
  } catch {
    return undefined;
  }
}

/**
 * Whether plain-text copying is available — `navigator.clipboard.writeText`.
 *
 * `false` under SSR, in a non-secure context, and on engines predating the Clipboard API. It does NOT predict
 * the permission: a copy can still come back `denied` if the call has no user gesture behind it. Treat it as
 * "is the road there", not "will the trip succeed".
 */
export function canCopy(): boolean {
  return clipboardMethod('writeText') !== undefined;
}

/**
 * Whether multi-format copying is available — `navigator.clipboard.write` plus a `ClipboardItem` constructor.
 * Strictly narrower than {@link canCopy}: every engine shipped `writeText` first.
 */
export function canCopyItems(): boolean {
  return clipboardMethod('write') !== undefined && clipboardItemConstructor() !== undefined;
}

/**
 * Whether reading from the clipboard is available — `navigator.clipboard.readText`.
 *
 * `false` in Firefox, which does not expose reading to page script at all, and under SSR. Even where it is
 * `true`, the read needs a user gesture and shows an explicit paste prompt. If all you need is the payload the
 * user just pasted, do not read at all — handle the `paste` event with `getPasteItems`, which needs no
 * permission and no prompt.
 */
export function canReadClipboard(): boolean {
  return clipboardMethod('readText') !== undefined;
}

/**
 * Whether the deprecated `document.execCommand('copy')` path is available — the only write that exists in a
 * non-secure context or on older Safari. Requires a document; `false` under SSR.
 *
 * A `true` here does not mean the copy will succeed: `execCommand` still requires the call to sit inside a user
 * gesture, and reports its own refusal by returning `false`.
 */
export function canLegacyCopy(): boolean {
  try {
    if (typeof document === 'undefined') return false;
    return typeof member(document, 'execCommand') === 'function';
  } catch {
    return false;
  }
}
