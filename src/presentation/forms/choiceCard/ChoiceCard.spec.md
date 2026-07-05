# ChoiceCard

## Purpose
Radio styled as a clickable card with title + description + optional icon. Common for plan/option pickers. Use inside `RadioGroup` for mutex selection.

## Props
| Name | Type | Default |
|---|---|---|
| `label` | `ReactNode` | — (required) |
| `description` | `ReactNode` | — |
| `icon` | `ReactNode` | — |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| ...rest | `RadioProps` | — |

## Dependencies
Foundation: `utils/cn`, `hooks/useId`. Same-domain: `Radio`.
