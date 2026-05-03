# ToggleButtonGroup

## Purpose
Coordinates a row/column of `ToggleButton` children. `type="single"` tracks one active value (radiogroup-like); `type="multi"` tracks an array.

## Props
| Name | Type | Default |
|---|---|---|
| `type` | `'single' \| 'multi'` | `'single'` |
| `value` / `defaultValue` | `string \| null` (single) or `string[]` (multi) | — / `null` or `[]` |
| `onValueChange` | callback | — |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `attached` | `boolean` | `true` |

Each child `<ToggleButton>` must declare a `value` prop matching the group's value.

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`. Same-domain: `ToggleButton`.

## Known limitations
RovingFocus arrow-key navigation deferred — group currently relies on default Tab focus order. Will land in P6 refactor pass.
