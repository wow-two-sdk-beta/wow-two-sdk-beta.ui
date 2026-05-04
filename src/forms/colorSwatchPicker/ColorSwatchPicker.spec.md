# ColorSwatchPicker

## Purpose
Grid of clickable color swatches — pick one preset color from a curated palette. Use for brand-color pickers, presets, or recently-used color rows.

## Anatomy
```
<ColorSwatchPicker>
  └── flex grid of <ColorSwatch onClick> with selected ring
</ColorSwatchPicker>
```

## Required behaviors
- Click a swatch → emits its color string. The selected swatch shows a ring.
- Keyboard: arrow keys move focus across swatches (roving tabindex). Enter/Space selects.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `colors` | `string[]` | — | yes | Palette to display. |
| `value` | `string \| null` | — | no | Controlled selection. |
| `defaultValue` | `string \| null` | `null` | no | Uncontrolled. |
| `onChange` | `(color) => void` | — | no | Selection callback. |
| `swatchSize` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | no | Forwarded to ColorSwatch. |
| `swatchShape` | `'square' \| 'circle'` | `'square'` | no | Forwarded. |
| `disabled` | `boolean` | `false` | no | Block all swatches. |

## Composition
Same-domain reuse of `ColorSwatch`.

## Accessibility
- Uses `RovingFocusGroup` from `primitives/` for arrow-key nav.

## Known limitations
- No multi-select (use a state-managed group of `ColorSwatch`es directly).
- No "+ add new color" button (deferred — caller wires it externally).

## Inspirations
- React Aria `ColorSwatchPicker`.
- Mantine `ColorPicker` swatch row.
