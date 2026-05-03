# ToggleButton

## Purpose
Two-state button (on/off) with `aria-pressed` and `data-state="on" | "off"`. Pair with `ToggleButtonGroup` for arrow-key navigation.

## Props
| Name | Type | Default |
|---|---|---|
| `pressed` | `boolean` | controlled |
| `defaultPressed` | `boolean` | `false` |
| `onPressedChange` | `(p: boolean) => void` | — |
| `variant` | `'solid' \| 'outline' \| 'ghost'` | `'ghost'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |

## Dependencies
Foundation: `utils/cn`, `utils/dataAttr`, `hooks/useControlled`, `tailwind-variants`.
