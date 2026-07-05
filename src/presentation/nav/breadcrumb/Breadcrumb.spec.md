# Breadcrumb

## Purpose
Linear position trail — links + separator. Last item is always plain text with `aria-current="page"`. Use the L5 collapsing version (planned) when the trail gets long.

## Props
| Name | Type | Default |
|---|---|---|
| `items` | `{ label, href? }[]` | — (required) |
| `separator` | `ReactNode` | chevron-right icon |

## Dependencies
Foundation: `utils/cn`, `icons/Icon`.
