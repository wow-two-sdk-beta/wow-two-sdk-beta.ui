// Domain-internal helpers for `nav/`. Not exported from the group barrel —
// the "internal" signal is absence from `index.ts`, not the file name.

/**
 * The DOM node behind a template ref, or `null`.
 *
 * The `typeof` guard is load-bearing rather than defensive. Every trigger here
 * seeds its anchor element from a `watch(..., { immediate: true, flush: 'post' })`,
 * and Vue runs an *immediate* watcher once during SSR — where `HTMLElement` is
 * not a global, so a bare `value instanceof HTMLElement` throws `ReferenceError`
 * and takes the whole server render down. Returning `null` on the server is
 * correct as well as safe: there is no element to anchor to until hydration.
 */
export function toHtmlElement(value: unknown): HTMLElement | null {
  if (typeof HTMLElement === 'undefined') return null;
  return value instanceof HTMLElement ? value : null;
}
