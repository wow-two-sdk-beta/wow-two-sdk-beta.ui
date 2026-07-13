# Section

## Purpose
Full-bleed `<section>` band with an inner centered `Container`. The repetitive marketing "section band" pattern — optional tinted (shadow-less) background via the `subtle` surface treatment, passthrough container width, and vertical padding.

## Props
| Name | Type | Default |
|---|---|---|
| `tone` | `SurfaceTone` (`'neutral' \| 'primary' \| 'danger' \| 'success' \| 'warning' \| 'info'`) | — (transparent) |
| `containerSize` | `ContainerProps['size']` (`'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| 'full'`) | `'lg'` |
| `py` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |
| `bleed` | `boolean` | `false` |

- `tone` set → band fills with the shadow-less `subtle` Surface treatment (low-alpha tint + `border-border`). Omitted → transparent band.
- `bleed` → renders content edge-to-edge (no inner `Container`).

## Anatomy
`<section>` (band: width + `py` + optional tint) → `<Container size={containerSize}>` (centered max-width) → children.

## Dependencies
Foundation: `utils/cn`, `utils/surfaceVariants`, `tailwind-variants`. Domain (layout): `Container`.
