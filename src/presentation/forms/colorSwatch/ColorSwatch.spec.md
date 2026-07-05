# ColorSwatch

## Purpose
Small color-preview chip — a square or circle filled with a color. Use for color tags, palette displays, the trigger of a `ColorPicker`, or any inline color indicator.

## Anatomy
Single `<div>` (or `<button>` if interactive) with the color as `background-color`.

## Required behaviors
- Renders a transparent-checkerboard backdrop so partial-alpha colors show through correctly.
- When clickable, behaves as a button (focus-visible ring).

## Visual states
`default` · `hover` (when interactive) · `focus-visible` (when interactive) · `disabled`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `color` | `string` | `'#000000'` | no | Any CSS color. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | no | Square edge length. |
| `shape` | `'square' \| 'circle'` | `'square'` | no | Border radius preset. |
| `onClick` | `(e) => void` | — | no | When provided, renders as a button. |
| `selected` | `boolean` | `false` | no | Render with a ring outline. |
| `disabled` | `boolean` | `false` | no | Greys out + blocks click. |

## Composition
Self-contained. Used by `ColorSwatchPicker`, `ColorPicker`, and freely by consumers.

## Dependencies
Foundation: `utils/cn`. Same-domain: none.

## Known limitations
- No tooltip on hover (consumer can wrap with `Tooltip` from `display/`).

## Inspirations
- Mantine `ColorSwatch`.
- React Aria `ColorSwatch`.
