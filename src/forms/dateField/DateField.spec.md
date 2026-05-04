# DateField

## Purpose
Atomic date input — wraps `<input type="date">` with our styling. Use directly in forms when a calendar popover isn't needed (use `DatePicker` for that). Accepts and emits native `Date` objects, not strings.

## Anatomy
Single styled `<input type="date">`.

## Required behaviors
- Native browser date picker on mobile (and most modern desktop browsers).
- ISO `YYYY-MM-DD` string under the hood; component does `Date ↔ string` conversion.
- `min` / `max` map to native input attributes.

## Visual states
Same as `forms/InputStyles` `inputBaseVariants`: `default` · `hover` · `focus-visible` · `invalid` · `disabled`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `Date \| null` | — | no | Controlled. |
| `defaultValue` | `Date \| null` | `null` | no | Uncontrolled. |
| `onChange` | `(d) => void` | — | no | Selection callback. |
| `min` / `max` | `Date \| null` | — | no | Native bounds. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | From `inputBaseVariants`. |
| `state` | `'default' \| 'invalid'` | `'default'` | no | From `inputBaseVariants`. |

## Composition
Single element. Works inside `FormField`.

## Dependencies
Foundation: `utils/cn`. Same-domain: `InputStyles`, `DateExtensions`.

## Known limitations
- Native picker UI varies across browsers.
- No locale customization (delegates to browser).
- For a unified custom UI across browsers, use `DatePicker` (L5).

## Inspirations
- React Aria `DateField` (segmented input — our P6 upgrade target).
- shadcn/ui `Input type="date"`.
