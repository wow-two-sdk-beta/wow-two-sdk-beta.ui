# TimePicker

## Purpose
Time input with a popover containing hour and minute lists. Use when a unified custom UI matters (cross-browser consistency over native `TimeField`'s browser-specific picker).

## Anatomy
```
<TimePicker>
  ├── trigger button (shows formatted time or placeholder)
  └── popover
        ├── hour column (00–23, scrollable)
        └── minute column (00, 05, ..., 55 by default, scrollable)
</TimePicker>
```

## Required behaviors
- Click trigger toggles popover. Outside click / Escape closes.
- Click an hour: updates hours portion. Click a minute: updates minutes portion. Popover stays open until dismissed.
- Selected hour/minute is highlighted and auto-scrolled into view on open.
- ARIA: trigger has `aria-haspopup="dialog"`. Lists have `role="listbox"`; cells have `role="option"`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `{ hours, minutes } \| null` | — | no | Controlled. |
| `defaultValue` | same | `null` | no | Uncontrolled. |
| `onChange` | `(t) => void` | — | no | Selection callback. |
| `minuteStep` | `number` | `5` | no | Minute interval. |
| `placeholder` | `string` | `'Pick a time'` | no | Trigger text when no value. |
| `format` | `(t) => string` | `HH:MM` | no | Custom display formatter. |
| `disabled`, `name`, `invalid` | — | — | no | Standard input shape. |

## Composition
Compound shape via internal popover (built inline using primitives — no cross-domain `Popover` import).

## Accessibility
- Hour/minute lists keyboard-navigable: ↑/↓ moves selection.
- Trigger announces current time to screen readers.

## Known limitations
- 24-hour display only (P6: locale-aware AM/PM).
- No seconds (most cases don't need them).
- Lists are simple buttons — for very long ranges (e.g. minute step 1), virtualization would help (deferred).

## Inspirations
- iOS time picker (two-column wheel).
- Mantine `TimeInput`.
- React Aria `TimeField` (wider feature set than ours).
