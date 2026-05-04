# ColorSlider

## Purpose
Horizontal slider for one channel of a color (`hue`, `saturation`, `value`, or `alpha`). The track renders a channel-specific gradient — hue spectrum for `hue`, gray→saturated for `saturation`, black→bright for `value`, transparent→opaque for `alpha`.

Use as the building block of `ColorPicker`, or standalone for hue-only inputs.

## Anatomy
```
<ColorSlider>
  ├── track  (with channel-specific gradient bg)
  └── thumb  (circle, draggable)
</ColorSlider>
```

## Required behaviors
- Pointer down on track or thumb → start drag. Pointer move → update value. Pointer up → release.
- Keyboard: ←/→ adjust by `step`; Home/End jump to min/max.
- ARIA: `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-orientation="horizontal"`.

## Visual states
`default` · `hover` · `focus-visible` · `disabled`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `channel` | `'hue' \| 'saturation' \| 'value' \| 'alpha'` | `'hue'` | no | Which channel this slider edits. |
| `value` | `number` | — | no | Channel value. Range depends on channel: hue 0–360; others 0–1. |
| `defaultValue` | `number` | `0` | no | Uncontrolled. |
| `onChange` | `(v) => void` | — | no | Drag/keystroke callback. |
| `color` | `HSV` | — | no | Context color used to render the saturation/value/alpha gradient. Ignored for hue. |
| `step` | `number` | `1` (hue) / `0.01` (others) | no | Keyboard step. |
| `disabled` | `boolean` | `false` | no | Block interaction. |

## Composition
Self-contained. Used by `ColorPicker`. Same-domain reuse: `ColorExtensions`.

## Accessibility
- WAI-ARIA Slider pattern.
- Keyboard usable for fine adjustment; pointer drag for coarse.

## Known limitations
- Horizontal only (vertical deferred).
- No double-thumb (range) variant.

## Inspirations
- React Aria `ColorSlider`.
- Mantine `HueSlider`, `AlphaSlider`.
