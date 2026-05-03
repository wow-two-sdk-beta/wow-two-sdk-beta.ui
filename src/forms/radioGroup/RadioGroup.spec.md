# RadioGroup

## Purpose
Mutex group of `RadioField` children. Single-value selection. Shared `name` auto-generated.

## Props
| Name | Type | Default |
|---|---|---|
| `legend` | `ReactNode` | — |
| `name` | `string` | auto |
| `value` / `defaultValue` | `string \| null` | — / `null` |
| `onValueChange` | `(next: string \| null) => void` | — |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` |
| `isDisabled` | `boolean` | `false` |

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`. Same-domain: `Fieldset`, `Legend`, `RadioField`.

## Known limitations
RovingFocus arrow-key nav deferred (P6).
