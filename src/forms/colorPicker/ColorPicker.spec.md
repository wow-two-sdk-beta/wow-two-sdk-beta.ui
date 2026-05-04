# ColorPicker

## Purpose
Full color picker — a trigger swatch that opens a popover containing a saturation/value area, a hue slider, an optional alpha slider, a hex input, and an optional preset palette. The first L5 organism to deliberately cross domains: it imports `Popover` from `overlays/`.

## Anatomy
```
<ColorPicker>
  ├── trigger: <ColorSwatch> + caption (formatted hex)
  └── <Popover.Content>
        ├── <ColorArea>
        ├── <ColorSlider channel="hue">
        ├── <ColorSlider channel="alpha"> (optional)
        ├── <ColorField>
        └── <ColorSwatchPicker> (optional, when `presets` provided)
</ColorPicker>
```

## Required behaviors
- Trigger click toggles popover. Outside click / Escape closes (handled by `Popover`).
- All sub-controls update the same internal HSV(+A) state. The bound `value` is a hex string (`#RRGGBB` or `#RRGGBBAA` if `withAlpha`).
- Stays open during fine adjustment (typical color-picker behavior).

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `string \| null` | — | no | Controlled hex. |
| `defaultValue` | `string \| null` | `'#3b82f6'` | no | Uncontrolled. |
| `onChange` | `(hex) => void` | — | no | Fires on every adjustment. |
| `withAlpha` | `boolean` | `false` | no | Show alpha slider; emits 8-digit hex. |
| `presets` | `string[]` | — | no | If provided, renders a `ColorSwatchPicker` row. |
| `triggerSize` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | no | Trigger swatch size. |
| `disabled` | `boolean` | `false` | no | Block interaction. |
| `name` | `string` | — | no | Hidden input ships hex with form submission. |

## Composition
- Cross-domain: imports `Popover` from `overlays/` (allowed under the revised cross-domain rule).
- Same-domain: uses `ColorSwatch`, `ColorArea`, `ColorSlider`, `ColorField`, `ColorSwatchPicker`, `ColorExtensions`.

## Accessibility
- Each sub-control carries its own slider semantics.
- Trigger is a `<button>` with `aria-haspopup="dialog"` (via `Popover`).

## Known limitations
- No "eyedropper" support (browser API only in some browsers — deferred).
- No "format toggle" (hex / rgb / hsl) — hex only for now.
- No history / "recent colors".

## Inspirations
- React Aria `ColorPicker`.
- Mantine `ColorPicker`.
- shadcn doesn't ship one — built from scratch here.
