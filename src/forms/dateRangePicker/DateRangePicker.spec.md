# DateRangePicker

## Purpose
Date-range input with a `RangeCalendar` popover. Shows "May 1 → May 7" in the trigger; opens a calendar to select start + end days.

## Anatomy
```
<DateRangePicker>
  ├── trigger button (shows formatted range or placeholder)
  └── popover
        └── <RangeCalendar>
</DateRangePicker>
```

## Required behaviors
- Click trigger toggles popover.
- Selecting first day in calendar marks start; second click finalizes end.
- Auto-closes when both ends picked. Outside click / Escape closes too.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `{ start, end } \| null` | — | no | Controlled. |
| `defaultValue` | same | `null` | no | Uncontrolled. |
| `onChange` | `(range) => void` | — | no | Selection callback. |
| `placeholder` | `string` | `'Pick a range'` | no | Trigger text. |
| `format` | `(d) => string` | locale short date | no | Per-end formatter. |
| `min` / `max` | `Date \| null` | — | no | Forwarded to RangeCalendar. |
| `isDisabled` | `(d) => boolean` | — | no | Forwarded. |
| `disabled`, `name`, `invalid` | — | — | no | Standard. |

## Composition
Wraps `RangeCalendar` (same domain). Floating panel built inline via primitives.

## Known limitations
- Single-month calendar (most range pickers show two months — deferred).

## Inspirations
- Mantine `DatePickerInput type="range"`.
- shadcn/ui range calendar example.
- React Aria `DateRangePicker`.
