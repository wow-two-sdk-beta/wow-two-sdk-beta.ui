# Combobox

## Purpose
Text-input + dropdown — type to filter/search a list of options. Use when the value space is large or free-text matching matters (autocomplete, async search, contact picker).

## Anatomy
```
<Combobox>
  <Combobox.Input placeholder?>
  <Combobox.Content>
    <Combobox.Item value>
    <Combobox.Group label?>
    <Combobox.Separator />
    <Combobox.Empty />
  </Combobox.Content>
</Combobox>
```

## Required behaviors
- Typing in input opens the panel; consumer renders only matching items.
- Focus stays on the input. Active descendant points at active option (`aria-activedescendant`).
- ↑/↓ moves active. Enter selects active. Escape closes (Escape twice clears the input).
- Click on item: selects + closes.
- ARIA: input has `role="combobox"` + `aria-controls` + `aria-expanded` + `aria-autocomplete="list"`.
- Selected value is **separate** from input text — selecting an item updates `value`, not necessarily `inputValue`.

## Visual states
Input: same as `forms/inputBase`. Items: same as `Listbox.Item`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `string` | — | no | Controlled selection. |
| `defaultValue` | `string` | — | no | Uncontrolled initial selection. |
| `onValueChange` | `(v) => void` | — | no | Selection callback. |
| `inputValue` | `string` | — | no | Controlled input text. |
| `defaultInputValue` | `string` | `''` | no | Uncontrolled initial input. |
| `onInputChange` | `(v) => void` | — | no | Fires on every input keystroke. |
| `disabled`, `name`, `invalid` | — | — | no | Same shape as `Select`. |

## Composition
Combobox manages its own item registry + active-descendant (does NOT use `Listbox` internally — different focus model). Reuses `listboxVariants` for visual parity.

## Accessibility
- WAI-ARIA Combobox v1.2 pattern.
- Input retains DOM focus for the lifetime of the interaction.
- Active descendant updates as user navigates / types.

## Known limitations
- Filtering is consumer-driven by default — render only matching items. (No built-in filter to avoid baking in a string-match policy.)
- No async loading state (deferred — caller can render `Combobox.Empty` with a custom message during loading).
- No multi-mode here; use `MultiSelect` or `TagsInput` for that.

## Inspirations
- React Aria `ComboBox`.
- Radix `Combobox` (formerly preview).
- shadcn/ui `Combobox` (built on `Command`).
