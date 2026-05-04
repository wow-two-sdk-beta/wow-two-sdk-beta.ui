# ColorArea

## Purpose
2D saturation/value picker — the square gradient at the heart of every color picker. X axis is saturation (0 → 1), Y axis is value (1 → 0, top to bottom). Hue is fixed by the parent.

## Anatomy
```
<ColorArea>
  └── square track (layered gradients) + draggable thumb
</ColorArea>
```

## Required behaviors
- Pointer down on track → set saturation+value to the point's coords; capture pointer.
- Pointer move while down → update saturation+value live.
- Keyboard: arrows adjust by `step`; PgUp/PgDn jump faster; Home/End jump to corners.
- ARIA: `role="slider"` (composite — represents the s+v plane), with explicit value text via `aria-valuetext`.

## Visual states
`default` · `hover` · `focus-visible` · `disabled`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `hue` | `number` (0–360) | `0` | no | Sets the area's base color. |
| `saturation` | `number` (0–1) | — | no | Controlled. |
| `value` | `number` (0–1) | — | no | Controlled. |
| `defaultSaturation` | `number` | `1` | no | Uncontrolled. |
| `defaultValue` | `number` | `1` | no | Uncontrolled. |
| `onChange` | `({ saturation, value }) => void` | — | no | Drag/key callback. |
| `step` | `number` | `0.01` | no | Keyboard step. |
| `disabled` | `boolean` | `false` | no | Block interaction. |

## Composition
Self-contained. Used by `ColorPicker`.

## Accessibility
- Single composite slider (the WAI-ARIA pattern for 2D pickers).
- Keyboard: ←/→ adjust saturation, ↑/↓ adjust value.

## Known limitations
- No alpha (use a separate `ColorSlider channel="alpha"` for that).
- Square only (rectangular variant deferred).

## Inspirations
- React Aria `ColorArea`.
- Mantine `ColorPicker` saturation rectangle.
