# Knob

## Purpose
Rotational input — a circular dial whose pointer angle maps to a numeric value. Common in audio plugins, image editors, and any "fine-grained continuous parameter" UI.

## Anatomy
SVG donut with an arc-track + an angled pointer line. Optional value text in the center.

## Required behaviors
- Pointer-drag rotates the pointer; angle maps to `value` against `min`/`max`.
- Wheel ↑/↓ steps by `step`.
- Keyboard ←/→ steps by `step`; Shift = `largeStep`; Home/End → min/max.
- Sweep over the visible arc (default 270°: from −135° to +135°).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | controlled | uncontrolled | |
| `min` / `max` | `number` | `0` / `1` | |
| `step` | `number` | `0.01` | |
| `largeStep` | `number` | `0.1` | Shift modifier |
| `size` | `number` (px) | `64` | Diameter |
| `arcDegrees` | `number` | `270` | Visible sweep |
| `tone` | `'brand' \| 'success' \| 'warning' \| 'danger' \| 'muted'` | `'brand'` | |
| `format` | `(value) => ReactNode` | `(v) => v.toFixed(2)` | Center text |
| `showValue` | `boolean` | `true` | |
| `disabled` | `boolean` | `false` | |
| `name` | `string` | — | Hidden input |

## Accessibility
- `role="slider"` + `aria-valuenow / aria-valuemin / aria-valuemax / aria-orientation="vertical"`.
- Keyboard arrows + Home/End + Shift modifier.

## Dependencies
Foundation: `utils`. No external libs.
