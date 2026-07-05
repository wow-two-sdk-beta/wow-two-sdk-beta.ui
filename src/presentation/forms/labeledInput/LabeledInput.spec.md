# LabeledInput

## Purpose
Lighter alternative to `FormField` — `Label` + control, with id wiring. No helper / error / FormControlContext. Use when you want speed for simple inline forms.

## Props
| Name | Type | Default |
|---|---|---|
| `label` | `ReactNode` | — (required) |
| `trailing` | `ReactNode` | — |
| `children` | single input element | — (required) |

## Dependencies
Foundation: `utils/cn`, `hooks/useId`. Same-domain: `Label`.
