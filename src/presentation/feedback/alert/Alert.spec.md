# Alert

## Purpose
Slotted alert composing `AlertSimple` + Icon + Title + Description + Actions + optional close button. Pair: `AlertSimple` (atomic) + `Alert` (this molecule).

## Props
| Name | Type | Default |
|---|---|---|
| `severity` | `'info' \| 'success' \| 'warning' \| 'danger' \| 'neutral'` | `'info'` |
| `icon` | `ReactNode` | — |
| `title` | `ReactNode` | — |
| `description` | `ReactNode` | — |
| `actions` | `ReactNode` | — |
| `onClose` | `() => void` | — |
| `closeLabel` | `string` | `'Dismiss'` |

## Dependencies
Foundation: `utils/cn`, `icons/Icon`. Same-domain: `AlertSimple`.
