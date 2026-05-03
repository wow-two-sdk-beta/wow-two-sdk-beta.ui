# MultiSelect

## Purpose
Multi-select dropdown — button trigger that opens a floating listbox in `multiple` mode. Selected values render as removable tags inside the trigger. Use when users pick zero-to-many from a small/medium set.

## Anatomy
```
<MultiSelect>
  <MultiSelect.Trigger>
    <MultiSelect.Tags placeholder?>     (renders selected values as Tag chips with remove buttons)
  </MultiSelect.Trigger>
  <MultiSelect.Content>
    <MultiSelect.Item value>
    <MultiSelect.Separator />
    <MultiSelect.Group label?>
  </MultiSelect.Content>
</MultiSelect>
```

## Required behaviors
- Selecting an item toggles inclusion in the value array. Panel STAYS open.
- Selected items render checkmarks (inherited from `Listbox` multi mode).
- Backspace inside the trigger area (when nothing typed) removes the last tag.
- Click on tag's × removes that value.
- All other keyboard / focus behavior matches `Select`.

## Visual states
Trigger: `default` · `hover` · `focus-visible` · `open` · `invalid` · `disabled`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `string[]` | — | no | Controlled selection. |
| `defaultValue` | `string[]` | `[]` | no | Uncontrolled initial. |
| `onValueChange` | `(v[]) => void` | — | no | Selection callback. |
| `disabled`, `name`, `invalid`, `defaultOpen`, `open`, `onOpenChange` | — | — | no | Same shape as `Select`. |

## Composition
Compound. Reuses `Listbox` in `multiple` mode for the panel + items.

## Dependencies
Foundation: same as `Select`. Same-domain: `forms/listbox`, `display/tag` is **not** allowed (cross-domain) — tags rendered inline with local styling.

## Known limitations
- No type-to-search. (Use `Combobox` if you need typeahead.)
- No item-creation (deferred to `TagsInput` L5).

## Inspirations
- Mantine `MultiSelect`.
- shadcn/ui combobox-with-tags pattern.
