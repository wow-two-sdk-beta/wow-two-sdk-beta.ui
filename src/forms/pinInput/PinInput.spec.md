# PinInput

## Purpose
One-time-code / PIN entry — N single-character cells. Auto-advance on type, backspace to previous, arrow-key nav, paste-spread.

## Props
| Name | Type | Default |
|---|---|---|
| `length` | `number` | `6` |
| `value` / `defaultValue` | `string` | — / `''` |
| `onValueChange` | `(value: string) => void` | — |
| `onComplete` | `(value: string) => void` | fires when last cell fills |
| `type` | `'numeric' \| 'alphanumeric'` | `'numeric'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `mask` | `boolean` | `false` |
| `isDisabled` | `boolean` | `false` |

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`. Same-domain: `forms/_styles`.
