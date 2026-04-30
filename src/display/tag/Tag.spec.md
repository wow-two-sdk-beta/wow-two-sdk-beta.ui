# Tag

## Purpose
Pill with optional close button. Use for chips, filters, tokens. For non-removable static labels prefer `Badge`.

## Props
| Name | Type | Default |
|---|---|---|
| `variant` | `'neutral' \| 'brand' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` |
| `onClose` | `() => void` | — |
| `closeLabel` | `string` | `'Remove'` |

## Dependencies
Foundation: `utils/cn`, `tailwind-variants`, `icons/Icon`. Close button is a raw `<button>` to keep the atom rule (no `IconButton` import).
