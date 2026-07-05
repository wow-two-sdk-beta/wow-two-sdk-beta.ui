# TextInput

## Purpose
Single-line `<input type="text">`. Auto-wires id / disabled / required / readOnly / aria-invalid from `FormControl` when present.

## Props
| Name | Type | Default |
|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `state` | `'default' \| 'invalid'` | from FormControl |

## Dependencies
Foundation: `utils/cn`, `primitives/formControlContext`. Same-domain: `forms/InputStyles`.
