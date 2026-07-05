# Navbar

## Purpose
Lightweight header band (`<header>`) with `start` / `center` / `end` slots laid out in a row inside a centered `Container`. The everyday "navbar + centered content" need that `AppShell` (a 5-slot dashboard grid with sidebar) overshoots.

## Props
| Name | Type | Default |
|---|---|---|
| `start` | `ReactNode` | — |
| `center` | `ReactNode` | — |
| `end` | `ReactNode` | — |
| `children` | `ReactNode` (replaces the slot layout) | — |
| `containerSize` | `ContainerProps['size']` (`'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| 'full'`) | `'lg'` |
| `height` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `sticky` | `boolean` | `false` |
| `tone` | `SurfaceTone` (`'neutral' \| 'primary' \| 'danger' \| 'success' \| 'warning' \| 'info'`) | — |
| `bordered` | `boolean` | `true` |

- Default (non-sticky); `sticky` pins to top with `z-sticky`.
- `tone` set → band fills with the shadow-less `subtle` Surface treatment; omitted → `bg-card`.
- `children` set → bypasses `start`/`center`/`end` for a fully custom row.
- With no `center` slot, `end` is pushed to the trailing edge (`ml-auto`).

## Anatomy
`<header>` (band: height + optional sticky + border + bg) → `<Container size={containerSize}>` (centered, flex row) → `start` · `center` (grows) · `end`.

## Dependencies
Foundation: `utils/cn`, `utils/surfaceVariants`, `tailwind-variants`. Domain (layout): `Container`.
