# CheckboxGroup

## Purpose
Multi-select group of `CheckboxField` children inside a `Fieldset` + optional `Legend`. Tracks selection as `string[]`.

## Props
| Name | Type | Default |
|---|---|---|
| `legend` | `ReactNode` | — |
| `value` / `defaultValue` | `string[]` | — / `[]` |
| `onValueChange` | `(next: string[]) => void` | — |
| `isDisabled` | `boolean` | `false` |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` |
| `children` | `<CheckboxField value="…">` × N | — |

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`. Same-domain: `Fieldset`, `Legend`, `CheckboxField`.

## Known limitations
RovingFocus arrow-key nav deferred (P6).
