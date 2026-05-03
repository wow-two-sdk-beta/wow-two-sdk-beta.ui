# SectionHeader

## Purpose
Section / page header — title + optional description + right-aligned actions slot. Common pattern for dashboard panels and form sections.

## Props
| Name | Type | Default |
|---|---|---|
| `title` | `ReactNode` | — (required) |
| `description` | `ReactNode` | — |
| `actions` | `ReactNode` | — |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2` |
| `size` | `'md' \| 'lg' \| 'xl' \| '2xl'` | `'lg'` |
| `bordered` | `boolean` | `true` |

## Dependencies
Foundation: `utils/cn`. Same-domain: `Heading`, `Text`.
