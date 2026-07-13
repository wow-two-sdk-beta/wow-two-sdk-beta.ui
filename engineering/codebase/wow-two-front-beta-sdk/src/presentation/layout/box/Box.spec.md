# Box

## Purpose
Lowest-level layout primitive — a polymorphic `div` (or any HTML element) for styling shells when no other layout atom fits.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `as` | `ElementType` | `'div'` | Render as a different element |
| `...rest` | `HTMLAttributes<HTMLElement>` | — | All native attrs forwarded |

## Composition
Polymorphic `as` prop. For richer slot semantics, use the `Slot` primitive directly.

## Dependencies
Foundation: `utils/cn`. No primitives, no atoms.
