# Marquee

## Purpose
Continuously scroll content horizontally or vertically. Children are duplicated once and the pair is animated by `-50%` so the loop is seamless. Optional pause-on-hover.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `direction` | `'left' \| 'right' \| 'up' \| 'down'` | `'left'` | |
| `speed` | `number` (s, full traversal) | `30` | |
| `pauseOnHover` | `boolean` | `true` | |
| `gap` | `number` (px) | `48` | Between duplicated copies |
| `vertical` | `boolean` | derived from direction | Override |

## Accessibility
Honors `prefers-reduced-motion` (animation paused, content static).

## Dependencies
Foundation: `utils`. Uses keyframes `marquee-x` / `marquee-y` defined in `src/index.css`.
