# Stat

## Purpose
Single metric — label + value + optional trend + helper. Building block for dashboard KPI grids.

## Props
| Name | Type | Default |
|---|---|---|
| `label` | `ReactNode` | — (required) |
| `value` | `ReactNode` | — (required) |
| `trend` | `{ value: number; label?: ReactNode }` | — |
| `helper` | `ReactNode` | — |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |

## Dependencies
Foundation: `utils/cn`, `icons/Icon`. Same-domain: `Heading`, `Text`.
