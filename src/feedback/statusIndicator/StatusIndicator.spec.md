# StatusIndicator

## Purpose
Two-line status block — colored dot + label + helper. Use on monitoring/status pages. For a one-line inline version see `display/Status`.

## Props
| Name | Type | Default |
|---|---|---|
| `tone` | `'success' \| 'warning' \| 'destructive' \| 'info' \| 'neutral'` | `'success'` |
| `label` | `ReactNode` | — (required) |
| `description` | `ReactNode` | — |
| `pulse` | `boolean` | `false` |

## Dependencies
Foundation: `utils/cn`.
