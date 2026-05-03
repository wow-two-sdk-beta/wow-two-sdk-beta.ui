# Listbox

## Purpose
Selection list with keyboard navigation. Single- or multi-select. Use standalone for inline selection UIs (file pickers, role pickers, drawer pickers); also the visual building block consumed by `Select` / `MultiSelect` / `Combobox`.

## Anatomy
```
<Listbox>
  ├── <Listbox.Group label?>      (optional)
  │     └── <Listbox.Item value>
  ├── <Listbox.Item value>
  ├── <Listbox.Separator />
  └── <Listbox.Empty />            (rendered when no items match)
</Listbox>
```

## Required behaviors
- Roving focus across items: ↑/↓ arrow, Home/End, PageUp/PageDown.
- Enter / Space selects focused item.
- Single mode: selecting a different item replaces current.
- Multi mode: selecting toggles; selected items show a check.
- Disabled items are skipped by keyboard nav and ignore pointer.
- ARIA: `role="listbox"` on root, `role="option"` + `aria-selected` on items, `aria-multiselectable` when multi.

## Visual states (per item)
`default` · `hover` · `focus-visible` · `selected` · `disabled`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `string \| string[]` | — | no | Controlled selection. Array iff `multiple`. |
| `defaultValue` | `string \| string[]` | — | no | Uncontrolled initial selection. |
| `onValueChange` | `(v) => void` | — | no | Fires on selection change. |
| `multiple` | `boolean` | `false` | no | Toggle multi-select. |
| `aria-label` | `string` | — | recommended | Required for a11y when no labelled-by. |
| `disabled` | `boolean` | `false` | no | Disable all items. |

`Listbox.Item`: `value` (req), `disabled?`, children.

## Composition
Compound — `Listbox.Item`, `Listbox.Group`, `Listbox.Separator`, `Listbox.Empty`. Items register via context for keyboard nav.

## Accessibility
- WAI-ARIA Listbox pattern.
- Focus stays on the listbox container (`role="listbox"`) with `aria-activedescendant` pointing at the active item id — this matches the Combobox/Select consumption pattern (form controls keep DOM focus on the input/trigger).
- For standalone use, focus moves to the listbox on tab; arrow keys navigate; Enter/Space select.

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`, `hooks/useId`. Same-domain: none.

## Known limitations
- No virtualization (deferred to P6).
- No type-to-search (deferred — needs `useTypeahead` hook).
- No drag-to-reorder.

## Inspirations
- Radix `Select` (compound API, value-based items).
- React Aria `ListBox` (active-descendant focus model).
- shadcn Command (popover + filterable list).
