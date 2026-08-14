# TimeField

## Purpose
Atomic time input — a typed `HH:MM` field with a design-system popover on its trailing clock button. Accepts and emits `Temporal.PlainTime`. `TimePicker` is the trigger-shaped peer; this one keeps the text field.

## Anatomy
Styled text `<input>` + trailing `PopoverTrigger` → `Popover` holding the shared hour/minute columns (`forms/TimeColumns`). Under `native`, a single styled `<input type="time">` and no popover.

## Required behaviors
- The popover is OURS, not the browser's. `<input type="time">` opens an OS panel that cannot be themed; that path is the `native` opt-in only.
- Typed draft commits on blur / Enter; an unparseable draft reverts, an emptied one clears to `null`.
- 24-hour `HH:MM` on the wire; the component does the `Temporal.PlainTime` conversion.

## Visual states
Same as `forms/InputStyles` `inputBaseVariants`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `{ hours, minutes } \| null` | — | no | Controlled. |
| `defaultValue` | same | `null` | no | Uncontrolled. |
| `onValueChange` | `(t) => void` | — | no | Selection callback. |
| `native` | `boolean` | `false` | no | Hands the panel back to the browser. Opt-in — the OS popup cannot be themed. |
| `minuteStep` | `number` | `5` | no | Minute interval in the popover column. |
| `placeholder` | `string` | `'--:--'` | no | Empty-state text. Ignored under `native`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | no | From `inputBaseVariants`. |
| `state` | `'default' \| 'invalid'` | `'default'` | no | From `inputBaseVariants`. |

## Composition
Single element. Works inside `FormField`.

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`, `primitives/useFormControl`. Same-domain: `InputStyles`, `DateExtensions`, `TimeColumns`. Sibling group: `overlays/popover`.

## Known limitations
- Typed entry is 24-hour only — no locale-aware 12h parsing yet.
- Under `native`, picker UI varies across browsers and 12h/24h display is the browser's call.
- For a trigger-shaped control with no text field, use `TimePicker` (L5).

## Inspirations
- React Aria `TimeField`.
- shadcn/ui `Input type="time"`.
