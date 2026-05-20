/*
 * Layer (z-index) constants — the single source of truth for stacking order.
 *
 * Each layer is a semantic name with a fixed z-index value. Components never
 * pick arbitrary numbers; they pick a named layer that matches their role.
 *
 * Gaps of 10 between layers leave room to insert a future intermediate tier
 * without renumbering. `Debug` lives far above the rest (9999) so DevTools /
 * inspector overlays always win.
 *
 * Tailwind utility classes (`z-base`, `z-dropdown`, etc.) are auto-generated
 * from matching `--z-index-*` entries in `src/index.css` (Tailwind v4 @theme).
 * Use either form:
 *
 *   className="z-dropdown"            // utility class
 *   style={layerStyle('Modal')}       // inline programmatic
 *   style={{ zIndex: Layer.Modal }}   // raw const
 */

export const Layer = {
  /** Visually hidden — slip under base layer. */
  Hide: -1,
  /** Default DOM flow — no z-index applied. */
  Base: 0,
  /** Slightly elevated — sticky list items, hover-cards inside a grid. */
  Raised: 10,
  /** Pinned widgets inside a section (panel, inline overlay). */
  Docked: 20,
  /** Page-level sticky header / footer. */
  Sticky: 30,
  /** System banners — cookie notice, status banner, alert strip. */
  Banner: 40,
  /** Dropdowns, popovers, comboboxes, menus, hover-cards anchored to a trigger. */
  Dropdown: 50,
  /** Modal backdrop / drawer scrim — the dim layer behind a modal. */
  Overlay: 60,
  /** Modal / dialog / drawer / sheet content sitting above its backdrop. */
  Modal: 70,
  /** Popovers / menus opened FROM inside a modal — must beat Modal. */
  Popover: 80,
  /** Toasts / snackbars / undo bars — survive above modals. */
  Toast: 90,
  /** Tooltips — highest functional layer. */
  Tooltip: 100,
  /** DevTools / design-system inspector overlays. Always wins. */
  Debug: 9999,
} as const;

export type LayerName = keyof typeof Layer;

/** Inline style helper for programmatic use. */
export function layerStyle(layer: LayerName): { zIndex: number } {
  return { zIndex: Layer[layer] };
}
