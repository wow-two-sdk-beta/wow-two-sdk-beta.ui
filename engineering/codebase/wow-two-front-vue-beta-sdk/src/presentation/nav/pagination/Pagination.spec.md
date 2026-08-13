# Pagination

## Purpose
Page-number row with prev/next + ellipses for skipped ranges. Stateless — consumer drives `page` and handles `onPageChange`.

## Props
| Name | Type | Default |
|---|---|---|
| `total` | `number` | — (required) |
| `page` | `number` (1-based) | — (required) |
| `onPageChange` | `(page: number) => void` | — (required) |
| `siblings` | `number` | `1` |

## Dependencies
Foundation: `utils/cn`, `icons/Icon`.
