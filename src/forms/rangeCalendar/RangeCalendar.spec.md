# RangeCalendar

## Purpose
Date-range picker — same calendar grid as `Calendar` but selects a `{ start, end }` range. Click first day → sets pending start. Click second → sets end. Hovering between clicks previews the range.

## Anatomy
```
<RangeCalendar>          (same shape as Calendar)
```

## Required behaviors
- First click after a fresh start: sets `start`, clears `end`.
- Second click: sets `end`. If clicked day is before pending `start`, swap them.
- Pointer-over a day after first click: preview range from `start` → hovered day.
- Days inside the range render with in-range background; the two endpoints render selected.
- Keyboard navigation matches `Calendar`. Enter on a focused day acts as a click.
- ARIA: same as `Calendar`.

## Visual states (per day cell)
`default` · `hover` · `focus-visible` · `range-start` · `range-end` · `in-range` · `today` · `out-of-month` · `disabled`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `{ start, end } \| null` | — | no | Controlled. |
| `defaultValue` | `{ start, end } \| null` | `null` | no | Uncontrolled. |
| `onChange` | `(range) => void` | — | no | Fires when both start + end picked. |
| `defaultMonth` | `Date` | today | no | Initial visible month. |
| `min` / `max` | `Date \| null` | — | no | Bounds. |
| `isDisabled` | `(d) => boolean` | — | no | Custom disable predicate. |

## Composition
Self-contained. `DateRangePicker` (L5) wraps it inside a Popover with start/end inputs.

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`. Same-domain: `_dateUtils`.

## Known limitations
- Single-month view (deferred — many real range pickers show two months side-by-side).
- No locale customization.

## Inspirations
- React Aria `RangeCalendar`.
- shadcn/ui `Calendar mode="range"`.
- Mantine `DatePicker type="range"`.
