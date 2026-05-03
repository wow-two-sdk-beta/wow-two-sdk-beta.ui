# CountBadge

## Purpose
Numeric badge — inbox/notification counts. Caps at `max` (default 99) and renders "99+". Hides on zero unless overridden.

## Props
| Name | Type | Default |
|---|---|---|
| `value` | `number` | — (required) |
| `max` | `number` | `99` |
| `hideZero` | `boolean` | `true` |
| `variant` | Badge variant | `'danger'` |

## Dependencies
Foundation: `utils/cn`. Same-domain: `Badge`.
