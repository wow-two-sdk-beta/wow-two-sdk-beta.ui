# IconButton

## Purpose
Button with only an icon — no visible text. Type system requires `aria-label`.

## Props
| Name | Type | Default | Required |
|---|---|---|---|
| `aria-label` | `string` | — | yes |
| `variant` | `'solid' \| 'soft' \| 'outline' \| 'ghost' \| 'danger'` | `'ghost'` | no |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | no |
| `shape` | `'square' \| 'circle'` | `'square'` | no |

## Composition
Strict atom — does NOT compose `Button`. Standalone implementation.

## Dependencies
Foundation: `utils/cn`, `tailwind-variants`.
