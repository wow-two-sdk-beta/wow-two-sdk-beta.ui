# TimeField

## Purpose
Atomic time input — wraps `<input type="time">` with our styling. Use directly when a time popover isn't needed (use `TimePicker` for that). Accepts and emits `{ hours, minutes }`.

## Anatomy
Single styled `<input type="time">`.

## Required behaviors
- Native browser time picker on mobile (and most modern desktop browsers).
- 24-hour `HH:MM` string under the hood; component does object-conversion.

## Visual states
Same as `forms/_styles` `inputBaseVariants`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `{ hours, minutes } \| null` | — | no | Controlled. |
| `defaultValue` | same | `null` | no | Uncontrolled. |
| `onChange` | `(t) => void` | — | no | Selection callback. |
| `step` | `number` (seconds) | — | no | Native step attr (e.g. `60` = 1 min, `300` = 5 min). |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | From `inputBaseVariants`. |
| `state` | `'default' \| 'invalid'` | `'default'` | no | From `inputBaseVariants`. |

## Composition
Single element. Works inside `FormField`.

## Dependencies
Foundation: `utils/cn`. Same-domain: `_styles`, `_dateUtils`.

## Known limitations
- Native picker UI varies across browsers.
- 12h vs 24h display delegated to browser locale.
- For unified custom UI, use `TimePicker` (L5).

## Inspirations
- React Aria `TimeField`.
- shadcn/ui `Input type="time"`.
