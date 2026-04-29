/**
 * Returns `""` when the condition is true, `undefined` otherwise.
 * Use for boolean `data-*` attributes — React strips the attr when value is undefined,
 * so the DOM cleanly toggles `data-state` rather than `data-state="false"`.
 */
export function dataAttr(condition: boolean | undefined): '' | undefined {
  return condition ? '' : undefined;
}
