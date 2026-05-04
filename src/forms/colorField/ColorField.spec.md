# ColorField

## Purpose
Text input for hex colors with a leading swatch preview. Validates on blur — accepts `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`. Use as a standalone input or as part of `ColorPicker`.

## Anatomy
```
<ColorField>
  ├── leading <ColorSwatch> (preview of current value)
  └── <input type="text"> (hex string)
</ColorField>
```

## Required behaviors
- Accepts hex with or without leading `#`. Auto-prepends `#` on blur if missing.
- Invalid hex on blur: revert to last valid value, set `state="invalid"` briefly (caller can wire validation).
- Emits `onChange(hexString)` only on valid hex (after blur or Enter).
- Pairs with `FormControl` (id, disabled, required, invalid, describedBy).

## Visual states
Same as `forms/InputStyles` `inputBaseVariants`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `string \| null` | — | no | Controlled hex (`#RRGGBB` or `#RRGGBBAA`). |
| `defaultValue` | `string \| null` | `null` | no | Uncontrolled. |
| `onChange` | `(hex \| null) => void` | — | no | Fires on commit (blur / Enter). |
| `size`, `state` | — | — | no | From `inputBaseVariants`. |
| `swatchShape` | `'square' \| 'circle'` | `'square'` | no | Swatch shape. |
| `withAlpha` | `boolean` | `false` | no | Allow / require 8-digit hex. |

## Composition
Self-contained. Same-domain reuse: `ColorSwatch`, `InputStyles`, `ColorExtensions`.

## Dependencies
Foundation: `utils/cn`, `hooks/useControlled`. Same-domain: `colorSwatch`, `InputStyles`, `ColorExtensions`.

## Known limitations
- Hex only (P6: support RGB/HSL syntax).

## Inspirations
- Mantine `ColorInput`.
- React Aria `ColorField`.
