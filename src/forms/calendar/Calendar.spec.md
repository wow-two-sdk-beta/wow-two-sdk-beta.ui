# Calendar

## Purpose
Standalone month-grid date picker — header with prev/next month nav, a 7×6 day grid, click-to-select. Use directly when you need an inline calendar; also the visual building block consumed by `DatePicker`.

## Anatomy
```
<Calendar>
  ├── header
  │     ├── prev button
  │     ├── month/year label
  │     └── next button
  ├── weekday row (Su Mo Tu We Th Fr Sa)
  └── day grid (6 rows × 7 cols, 42 cells)
</Calendar>
```

## Required behaviors
- Click a day to select. `value` controlled or `defaultValue` uncontrolled.
- Header buttons step the visible month by ±1.
- Keyboard: arrows move focused day, Home/End jump to start/end of week, PageUp/PageDown step month, Shift+PgUp/PgDn step year, Enter selects, Escape blurs (caller can wire dismissal).
- Disabled days (via `min`/`max`/`isDisabled`) are non-interactive.
- Days outside the target month render dimmed but remain clickable (clicking jumps the visible month).
- ARIA: container `role="application"` with `aria-label`; day cells `role="gridcell"` (semantic-light — full grid pattern deferred).

## Visual states (per day cell)
`default` · `hover` · `focus-visible` · `selected` · `today` · `out-of-month` · `disabled`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `Date \| null` | — | no | Controlled. |
| `defaultValue` | `Date \| null` | `null` | no | Uncontrolled. |
| `onChange` | `(d) => void` | — | no | Selection callback. |
| `defaultMonth` | `Date` | today (or `value`'s month) | no | Initial visible month. |
| `min` / `max` | `Date \| null` | — | no | Selectable range bounds. |
| `isDisabled` | `(d) => boolean` | — | no | Custom disable predicate. |

## Composition
Self-contained. `DatePicker` (L5) embeds it inside a Popover. `RangeCalendar` (L5) reimplements the visual pattern with range state.

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`. Same-domain: `_dateUtils`.

## Known limitations
- No multi-month view (deferred).
- No locale-aware weekday/month names (en-US default; deferred to P6 with Intl integration).
- No year/month dropdown jumper (deferred — caller can wrap with custom controls).

## Inspirations
- React Aria `Calendar`.
- shadcn/ui `Calendar` (built on `react-day-picker`).
- Mantine `DatePicker`.
