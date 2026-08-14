# DateField

## Purpose
Atomic date input — a typed `YYYY-MM-DD` field with a design-system `Calendar` popover on its trailing button. Accepts and emits `Temporal.PlainDate`. `DatePicker` is the trigger-shaped peer; this one keeps the text field, so reach for it when the user should be able to TYPE the date.

## Anatomy
Styled text `<input>` + trailing `PopoverTrigger` → `Popover` holding a `Calendar`. Under `native`, a single styled `<input type="date">` and no popover.

## Required behaviors
- The popover is OURS, not the browser's. `<input type="date">` opens an OS panel that cannot be themed; that path is the `native` opt-in only.
- Typed draft commits on blur / Enter; an unparseable draft reverts, an emptied one clears to `null`.
- Picking a day closes the popover — the day IS the whole value.
- ISO `YYYY-MM-DD` on the wire; the component does the `Temporal.PlainDate` conversion.
- `min` / `max` bound the calendar's selectable days, and map to the native attributes under `native`.

## Visual states
Same as `forms/InputStyles` `inputBaseVariants`: `default` · `hover` · `focus-visible` · `invalid` · `disabled`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `Date \| null` | — | no | Controlled. |
| `defaultValue` | `Date \| null` | `null` | no | Uncontrolled. |
| `onChange` | `(d) => void` | — | no | Selection callback. |
| `min` / `max` | `Date \| null` | — | no | Selectable bounds. |
| `native` | `boolean` | `false` | no | Hands the panel back to the browser. Opt-in — the OS popup cannot be themed. |
| `placeholder` | `string` | `'YYYY-MM-DD'` | no | Empty-state text. Ignored under `native`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | From `inputBaseVariants`. |
| `state` | `'default' \| 'invalid'` | `'default'` | no | From `inputBaseVariants`. |

## Composition
Single element. Works inside `FormField`.

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`, `primitives/useFormControl`. Same-domain: `InputStyles`, `DateExtensions`, `Calendar`. Sibling group: `overlays/popover`.

## Known limitations
- Typed entry is ISO-only — no locale-aware parsing (`04/03/2026` is rejected, not guessed).
- Under `native`, picker UI varies across browsers and display format is the browser's call.
- For a trigger-shaped control with no text field, use `DatePicker` (L5).

## Inspirations
- React Aria `DateField` (segmented input — our P6 upgrade target).
- shadcn/ui `Input type="date"`.
