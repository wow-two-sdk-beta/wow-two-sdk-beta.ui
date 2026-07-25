// Guarded access to the three globals this slice touches — `document`, `navigator`, `screen` — plus the hostile-
// read helper every property access here routes through. Internal: absent from the barrel.
//
// WHY THIS EXISTS AT ALL: the APIs in this slice are the least uniformly implemented in the browser platform.
// Fullscreen ships prefixed on Safari, wake lock is absent on most desktop browsers, `screen.orientation` is
// missing on older iOS. Under SSR all three globals are gone. Reading any of them directly means a `typeof`
// guard at ~20 call sites; one of them will eventually be forgotten, and the failure mode is a `ReferenceError`
// thrown from a module that promises never to throw.
//
// WHY EVERY READ IS TRY-WRAPPED: a property read can itself throw. A polyfill installs a getter that throws when
// its preconditions are unmet; a `Proxy` traps `get`; an embedded context revokes access to a cross-origin
// `document` member. `foundation/errors` takes exactly this posture for the same reason — a guard that throws
// defeats its own purpose. Unreadable therefore reads as absent, never as a failure.
//
// The typed-cast idiom: reads return `unknown` and each call site casts to the precise signature it needs
// (`as (() => Promise<void>) | undefined`), rather than the slice sharing one loose callable type. The cast is
// narrow, local, and documents the shape the platform is expected to provide at that exact point.

/**
 * Reads `key` off `source`, yielding `undefined` for a non-object, a missing member, or a read that throws.
 *
 * The workhorse of this slice: prefixed members (`webkitRequestFullscreen`) are not in the DOM lib's types, and
 * stubs in tests are partial by design, so nothing may assume a member is present or readable.
 *
 * @param source The value to read from — safely accepts `undefined`, `null`, and primitives.
 * @param key The property name to read.
 * @returns The member's value, or `undefined` when it is absent or unreadable.
 */
export function readMember(source: unknown, key: string): unknown {
  try {
    if (source === null || (typeof source !== 'object' && typeof source !== 'function')) return undefined;
    return (source as Record<string, unknown>)[key];
  } catch {
    // A throwing getter or `Proxy` trap. Unreadable reads as absent — see this file's header.
    return undefined;
  }
}

/**
 * Whether `value` is callable — the capability check behind every `*Supported` predicate in this slice.
 *
 * Deliberately only a check: call sites cast to their own precise signature before invoking, so this never
 * becomes a loose way to call an unknown value.
 *
 * @param value The value to test.
 * @returns `true` when `value` is a function.
 */
export function isFunction(value: unknown): boolean {
  return typeof value === 'function';
}

/**
 * The document, or `undefined` when there is none — SSR, a worker, or any non-DOM host.
 *
 * @returns The global `document`, or `undefined`.
 */
export function getDocument(): Document | undefined {
  try {
    return typeof document === 'undefined' ? undefined : document;
  } catch {
    // A host that throws on the global itself. Treated as no DOM.
    return undefined;
  }
}

/**
 * The navigator, or `undefined` when there is none.
 *
 * Note Node ships a real `globalThis.navigator` with none of the members this slice wants, so a defined
 * navigator proves nothing on its own — every member is still capability-checked before use.
 *
 * @returns The global `navigator`, or `undefined`.
 */
export function getNavigator(): Navigator | undefined {
  try {
    return typeof navigator === 'undefined' ? undefined : navigator;
  } catch {
    // See `getDocument`.
    return undefined;
  }
}

/**
 * The screen, or `undefined` when there is none.
 *
 * @returns The global `screen`, or `undefined`.
 */
export function getScreen(): Screen | undefined {
  try {
    return typeof screen === 'undefined' ? undefined : screen;
  } catch {
    // See `getDocument`.
    return undefined;
  }
}
