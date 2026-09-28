# Vue SDK gap analysis

*Last updated: 2026-09-26*

> What `@wow-two-beta/ui-vue` lacks after the published `0.0.7` sweep — missing components, shallow families and
> small defects — ranked for the gap-close queue in [`vue-port-track.md`](../../planning/vue-port-track.md).
> React is out of scope; the React package is parked.
>
> Status 2026-09-28: every queued gap (G1–G13) is built and locally verified, unpublished — see the track.

## Method

- Inventory: every value export of the seven `presentation/*` barrels, resolved through the built declarations.
- Checklist: this repo's component matrices ([`ideas.md`](ui-philosophy/ideas.md) §5) and the standard component sets of
  Reka UI, PrimeVue, Naive UI, Element Plus and Vuetify.
- Depth: props, emits and slots read from each candidate family's source and `*.spec.md`.
- Filter: a gap counts only when a product needs it generically; product-owned and companion-package items are listed
  separately, never queued.

---

## Baseline

| Measure | Value |
|---|---|
| Published | `0.0.7` (npm `latest`), the full correctness sweep |
| Presentation value exports | actions 25 · display 194 · feedback 40 · forms 168 · layout 62 · nav 50 · overlays 68 |
| Capability modules | 47 `foundation/*` + `auth` `query` `router` `formsEngine` `feedback` `flags` `analytics` `domain` |
| Local gates at analysis time | typecheck + 409 SFCs · lint · format · 160 files / 2,042 unit/DOM/SSR tests — all green |

Breadth is high and the sweep closed the correctness backlog. The gaps are depth inside a few families, one set of
standard components every mainstream Vue library ships, and three unlocalized accessible names.

---

## Status

Shipped locally 2026-09-26 as G1–G6 of the [gap-close queue](../../planning/vue-port-track.md#gap-close-queue):
the menu vector, `RatingPicker`, `RangeSliderInput`, `ConfirmPopover`, `TruncatedText`, `CountdownText`,
`ErrorBoundary`, `StickyLayout`, `VirtualScrollArea` and the three localized names. The same pass fixed a
`DropdownMenuContent` exit that could leave an empty, focus-trapping surface. The remaining rows are G7–G13.

---

## Shallow families

| Family | Missing capability | Impact |
|---|---|---|
| `Menu` → `DropdownMenu` · `ContextMenu` · `Menubar` | checkbox items, radio groups, submenus | every settings/sort/"view" menu hand-rolls them |
| `SliderInput` | two-thumb range | price/date-span filters need a range value |
| `DataTable` | row selection, expandable rows, sticky header, loading state | admin lists rebuild selection per product |
| `DatePicker` | month/year granularity | billing periods and reports pick a month |
| `ImagePreview` | zoom/lightbox | galleries need a full-screen viewer |

`foundation/selection` already carries the headless selection/sort/filter models `DataTable` should adopt.

`Tag` was listed as lacking removal; it already closes through `@close` + `closeLabel`, so that row was dropped (2026-09-28).

---

## Missing components

| Component | Kind → folder | Why it is generic |
|---|---|---|
| `RatingPicker` | control → `forms/` | reviews, feedback, scoring |
| `RangeSliderInput` | control → `forms/` | range filters |
| `ConfirmPopover` | overlay → `overlays/` | inline "are you sure?" beside the trigger, lighter than `AlertModal` |
| `TruncatedText` | display → `display/` | clamped copy with an accessible show more/less |
| `CountdownText` | display → `display/` | expiry, OTP resend, launch timers |
| `ErrorBoundary` | state → `feedback/` | a failed widget must not blank the page; `AppErrorBoundary` is route-only |
| `StickyLayout` | layout → `layout/` | sticky toolbars/headers with a stuck state for styling |
| `VirtualScrollArea` | layout → `layout/` | long lists; `useVirtualList` exists headless only |
| `TreeSelectPicker` · `CascaderPicker` · `TransferPicker` | control → `forms/` | hierarchical and dual-list selection in admin forms |
| `MonthPicker` · `YearPicker` | control → `forms/` | period selection |
| `SidebarMenu` · `BottomNavMenu` | nav → `nav/` | collapsible app navigation and the mobile tab bar |
| `LightboxModal` | overlay → `overlays/` | image/media galleries |
| `MentionInput` | control → `forms/` | `@`/`#` completion in comments and chat |
| `SignaturePad` · `ImageCropEditor` | control → `forms/` | sign-off and avatar upload flows |
| `KanbanBoard` · `MasonryLayout` · `OverflowGroup` | display/layout | boards, galleries, "+N more" rows |
| `TimezonePicker` · `DurationInput` | control → `forms/` | scheduling |

---

## Defects and improvements

| Item | Where | Fix |
|---|---|---|
| Accessible name falls back to the component name `'KnobInput'` | `forms/knobInput/KnobInput.vue` | localized `KnobInput.label` |
| Unlocalized `'Icons'` listbox name | `forms/iconPicker/IconPicker.vue` | localized `IconPicker.icons` |
| Unlocalized `'Collapse'` / `'Expand'` toggles | `forms/jsonEditor/JsonEditorTreeNode.vue` | localized `JsonEditorTreeNode.*` |
| `DataTable` keeps its own sort model | `display/dataTable` | ✅ 2026-09-28: selection and the value ordering now come from `foundation/selection`; absent values sort last in both directions |
| Unprefixed booleans predate the props rule | `Pagination.hideFirstLast` · `CommandPaletteModalItem.closeOnSelect` | rename on the next breaking pass |
| Carried from the sweep | Firefox CI result · `smart-qr` visual acceptance · NodeEditor read-only · calendar week start · large-diff paging | owned by their existing rows |

---

## Not gaps

- Custom directives, `Transition` and `defineModel` are banned by the Vue construct rules; composables cover them.
- QR rendering stays product-owned ([ForeverPin readiness](forever-pin-vue-readiness.md) § *Product-owned boundary*).
- Charts, maps, rich-text and 3D are companion-package vectors ([`targets.md`](ui-philosophy/targets.md) §8).
- A JSON tree viewer exists as `JsonEditor`'s tree mode; a count-up and marquee already ship.
