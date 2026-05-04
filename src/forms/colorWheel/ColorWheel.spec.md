# ColorWheel

## Purpose
Circular hue picker — a ring with the hue spectrum painted as a conic gradient. Use as an alternative to `ColorSlider channel="hue"` for picker UIs that prefer the wheel metaphor.

## Anatomy
```
<ColorWheel>
  ├── conic-gradient ring (CSS-painted)
  └── thumb (circle, on the ring at the current hue's angle)
</ColorWheel>
```

## Required behaviors
- Pointer down on ring → set hue to the angle from center; capture pointer.
- Pointer move while down → update hue live.
- Keyboard: ←/→ adjusts by `step`; Home/End jump.
- Convention: hue 0° at 12 o'clock, increasing clockwise.
- ARIA: `role="slider"` for the hue value.

## Visual states
`default` · `hover` · `focus-visible` · `disabled`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `number` (0–360) | — | no | Controlled hue. |
| `defaultValue` | `number` | `0` | no | Uncontrolled. |
| `onChange` | `(hue) => void` | — | no | Callback. |
| `size` | `number` (px) | `200` | no | Outer diameter. |
| `thickness` | `number` (px) | `30` | no | Ring thickness. |
| `step` | `number` | `1` | no | Keyboard step. |
| `disabled` | `boolean` | `false` | no | Block interaction. |

## Composition
Self-contained.

## Accessibility
- WAI-ARIA Slider pattern.

## Known limitations
- Hue only. Saturation/value live on `ColorArea` or `ColorSlider`.
- No support for displaying current selection inside the wheel center (consumer can stack a swatch).

## Inspirations
- React Aria `ColorWheel`.
- Mantine doesn't ship a wheel — included here for parity.
