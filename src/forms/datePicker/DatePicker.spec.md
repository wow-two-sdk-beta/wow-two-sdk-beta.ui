# DatePicker

## Purpose
Date input with a calendar popover — click the trigger to open a `Calendar` for selection. Use when a unified custom UI matters (cross-browser consistency over native `DateField`'s browser-specific picker).

## Anatomy
```
<DatePicker>
  ├── trigger button (shows formatted date or placeholder)
  └── popover
        └── <Calendar>          (embedded)
</DatePicker>
```

## Required behaviors
- Click trigger toggles popover. Outside click / Escape closes.
- Selecting a day in the calendar fills the value + closes the popover.
- Focus returns to trigger on close.
- ARIA: trigger has `aria-haspopup="dialog"`, `aria-expanded`. Popover wraps `Calendar`.

## Visual states
Trigger: same as `forms/_styles` `inputBaseVariants` plus `data-state="open"`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `Date \| null` | — | no | Controlled. |
| `defaultValue` | `Date \| null` | `null` | no | Uncontrolled. |
| `onChange` | `(d) => void` | — | no | Selection callback. |
| `placeholder` | `string` | `'Pick a date'` | no | Trigger text when no value. |
| `format` | `(d) => string` | `Date.toLocaleDateString()` | no | Custom display formatter. |
| `min` / `max` | `Date \| null` | — | no | Forwarded to Calendar. |
| `isDisabled` | `(d) => boolean` | — | no | Forwarded to Calendar. |
| `disabled`, `name`, `invalid` | — | — | no | Standard input shape. |

## Composition
Wraps `Calendar` (same domain). Floating panel built inline via primitives (no cross-domain `Popover` import).

## Accessibility
- WAI-ARIA Date Picker pattern.
- Title-less popover: trigger's accessible name labels the dialog.

## Known limitations
- No keyboard typing into the trigger (use `DateField` if typing matters more than the calendar UI).
- Single-month calendar.

## Inspirations
- shadcn/ui `Popover + Calendar` recipe.
- Mantine `DateInput`.
- React Aria `DatePicker`.
