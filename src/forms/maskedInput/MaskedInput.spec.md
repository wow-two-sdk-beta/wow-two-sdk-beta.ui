# MaskedInput

## Purpose
Text input that enforces a character-class mask. Tokens: `#` digit, `A` letter, `*` alphanumeric; anything else literal.

## Examples
- `"###-###-####"` — US phone
- `"##/##/####"` — date
- `"AAA-####"` — license plate

## Props
| Name | Type | Default |
|---|---|---|
| `mask` | `string` | — (required) |
| `value` / `defaultValue` | `string` | — / `''` |
| `onValueChange` | `(value: string) => void` | — |
| ...rest | `InputBaseVariants` + native attrs | — |

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`, `primitives/formControlContext`. Same-domain: `forms/_styles`.

## Known limitations
- Does not handle paste cleanup (pasted literals beyond mask are dropped one at a time).
- Single-pass left-to-right matcher; no greedy backtracking.
