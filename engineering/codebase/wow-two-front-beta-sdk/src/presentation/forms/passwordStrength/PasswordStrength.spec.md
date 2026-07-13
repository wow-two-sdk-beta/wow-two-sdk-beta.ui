# PasswordStrength

## Purpose
Strength meter beneath a password field. Naive rule-based scoring 0–4 by default; pass `score` to drive externally (e.g. zxcvbn).

## Props
| Name | Type | Default |
|---|---|---|
| `value` | `string` | — (required) |
| `score` | `0 \| 1 \| 2 \| 3 \| 4` | computed |
| `hideLabel` | `boolean` | `false` |

## Dependencies
Foundation: `utils/cn`.
