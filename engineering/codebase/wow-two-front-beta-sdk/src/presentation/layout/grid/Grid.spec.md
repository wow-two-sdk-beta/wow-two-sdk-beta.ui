# Grid

## Purpose
CSS grid container with `columns` (1–12) and `gap` variants. For non-uniform tracks, pass `style={{ gridTemplateColumns }}` directly.

## Props
| Name | Type | Default |
|---|---|---|
| `columns` | `GridColumns \| GridResponsive<GridColumns>` | `'2'` |
| `gap` | `GridGap \| GridResponsive<GridGap>` | `'4'` |
| `as` | `ElementType` | `'div'` |

`GridColumns` = `'1' \| '2' \| '3' \| '4' \| '5' \| '6' \| '8' \| '12'`.
`GridGap` = `'0' \| '1' \| '2' \| '3' \| '4' \| '5' \| '6' \| '8' \| '10' \| '12'`.
`GridResponsive<T>` = `Partial<Record<'base' \| 'sm' \| 'md' \| 'lg' \| 'xl', T>>` — `base` is unprefixed; the rest map to Tailwind `sm:`–`xl:`. Example: `columns={{ base: '1', md: '2', lg: '3' }}`.

## Dependencies
Foundation: `utils/cn`, `tailwind-variants`.
