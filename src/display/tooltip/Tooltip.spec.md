# Tooltip

## Purpose
Hover- and focus-triggered tooltip. Wraps a single child as the trigger; tooltip body renders into a Portal positioned by Floating UI.

## Props
| Name | Type | Default |
|---|---|---|
| `content` | `ReactNode` | — (required) |
| `children` | `ReactElement` (single) | — (required) |
| `placement` | Floating UI placement | `'top'` |
| `openDelay` | `number` (ms) | `700` |
| `closeDelay` | `number` (ms) | `0` |
| `open` | `boolean` | controlled |
| `disabled` | `boolean` | `false` |

## Dependencies
Foundation: `utils/cn`, `utils/composeRefs`. Primitives: `Portal`, `AnchoredPositioner`.

## Known limitations
- Pointer-only via `pointerenter`/`leave` and `focus`/`blur`. Touch behavior follows browser defaults.
- Single child requirement enforced at runtime — array/text children render unchanged with no tooltip.
