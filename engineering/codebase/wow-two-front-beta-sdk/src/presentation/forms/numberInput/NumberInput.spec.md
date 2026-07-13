# NumberInput

## Purpose
`<input type="number">` with stepper buttons. Steppers are raw `<button>` to keep the strict atom rule (NumberInput is L3, so importing Button would make this an atom-on-atom composition).

## Props
| Name | Type | Default |
|---|---|---|
| `step` | `number` | `1` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |

## Dependencies
Foundation: `utils/cn`, `icons/Icon`, `primitives/formControlContext`. Same-domain: `forms/InputStyles`.
