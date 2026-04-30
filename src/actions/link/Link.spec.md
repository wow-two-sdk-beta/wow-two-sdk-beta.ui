# Link

## Purpose
Anchor with focus + hover styling. `asChild` lets a router-aware `<Link>` adopt the visuals.

## Props
| Name | Type | Default |
|---|---|---|
| `variant` | `'default' \| 'subtle' \| 'muted' \| 'inherit'` | `'default'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `asChild` | `boolean` | `false` |

## Composition
Polymorphism via `Slot`/`asChild` — preferred over `as` for routing libraries that ship their own `<Link>`.

## Dependencies
Foundation: `utils/cn`, `tailwind-variants`, `primitives/Slot`.
