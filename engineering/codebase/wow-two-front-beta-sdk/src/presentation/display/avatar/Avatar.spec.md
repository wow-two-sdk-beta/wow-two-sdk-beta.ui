# Avatar

## Purpose
Person / entity image with initials fallback. Single component — no `Avatar.Image` / `Avatar.Fallback` slots in v0; pass `fallback` directly when initials aren't enough.

## Props
| Name | Type | Default |
|---|---|---|
| `src` | `string` | — |
| `name` | `string` | `''` |
| `fallback` | `ReactNode` | — |
| `alt` | `string` | `name` |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` |
| `shape` | `'circle' \| 'square'` | `'circle'` |

## Dependencies
Foundation: `utils/cn`, `tailwind-variants`. No imports of other atoms — fallback initials are rendered inline.
