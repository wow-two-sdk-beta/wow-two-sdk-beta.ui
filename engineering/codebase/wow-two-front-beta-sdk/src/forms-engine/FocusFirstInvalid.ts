/*
 * Focus-first-invalid — the submit-rejection a11y hop (docs/analysis/forms-vector-next.md F-2e).
 * Contract-neutral by construction: it reads the `aria-invalid="true"` the FormControlContext
 * glue stamps on every wired control, so it behaves identically on every engine adapter
 * (house, tanstack) and for client AND server errors — anything that flips a field invalid.
 * DOM order = visual order, so "first" matches what the user sees.
 */

/**
 * Focuses the first invalid, focusable control inside `root` and returns it (`null` when
 * nothing qualifies — the form is valid, or every invalid control is disabled/hidden).
 *
 * Call it after `handleSubmit` settles; capture the form element BEFORE awaiting — React
 * nulls `event.currentTarget` once the handler returns:
 *
 * ```tsx
 * <form onSubmit={(event) => {
 *   const root = event.currentTarget;
 *   void form.handleSubmit(event).then(() => focusFirstInvalid(root));
 * }}>
 * ```
 */
export function focusFirstInvalid(root: ParentNode | null | undefined): HTMLElement | null {
  if (!root) return null;
  for (const candidate of root.querySelectorAll<HTMLElement>('[aria-invalid="true"]')) {
    // Disabled controls (native or ARIA widget) never take focus — skip to the next invalid one.
    if (candidate.matches(':disabled') || candidate.getAttribute('aria-disabled') === 'true') continue;
    // Focusable = in the tab order: native controls default 0; ARIA widgets need an explicit tabindex.
    if (candidate.tabIndex < 0) continue;
    candidate.focus();
    // `focus()` silently no-ops on undisplayed nodes — only a verified move counts.
    if (candidate.ownerDocument.activeElement === candidate) return candidate;
  }
  return null;
}
