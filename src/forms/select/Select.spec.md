# Select

## Purpose
Single-select dropdown — button trigger that opens a floating listbox. Use when the value space is small/medium (≤ ~50 options) and a typeahead isn't needed. For larger sets or free-text matching, use `Combobox`.

## Anatomy
```
<Select>
  <Select.Trigger>
    <Select.Value placeholder?>
  </Select.Trigger>
  <Select.Content>
    <Select.Group label?>
      <Select.Item value>
    </Select.Group>
    <Select.Separator />
    <Select.Empty />
  </Select.Content>
</Select>
```

## Required behaviors
- Trigger toggles open. Click outside / Escape closes. Focus returns to trigger on close.
- ↑/↓ inside content moves active descendant. Enter selects + closes. Home/End jump.
- Open state autofocuses the listbox; selected item becomes active.
- ARIA: trigger gets `role="button"` + `aria-haspopup="listbox"` + `aria-expanded`. Content is a `role="listbox"`.

## Visual states
Trigger: `default` · `hover` · `focus-visible` · `open` · `invalid` · `disabled`
Item: same as `Listbox.Item`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `string` | — | no | Controlled value. |
| `defaultValue` | `string` | — | no | Uncontrolled initial. |
| `onValueChange` | `(v) => void` | — | no | Selection callback. |
| `disabled` | `boolean` | `false` | no | Disable trigger + content. |
| `name` | `string` | — | no | If provided, a hidden `<input>` ships the value with form submission. |
| `placeholder` | `string` | — | no | Shown by `Select.Value` when nothing selected. |

## Composition
Compound. State lives on the root via context. `Select.Item` is `Listbox.Item` (same-domain reuse — keeps visual + a11y identical to standalone `Listbox`).

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`, primitives `Portal`, `AnchoredPositioner`, `DismissableLayer`, `FocusScope`. Same-domain: `forms/listbox`.

## Known limitations
- No type-to-search (deferred to P6 with `useTypeahead`).
- Width: trigger and content are independent — caller styles content width via class.
- No virtualization.

## Inspirations
- Radix `Select`.
- shadcn/ui `Select`.
- Mantine `Select` (compound API + label registry).
