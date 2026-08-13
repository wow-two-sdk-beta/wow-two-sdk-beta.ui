# AnimatedNumber

## Purpose
Smooth-tween a displayed number whenever its `value` prop changes. Unlike `CountUp` (one-shot from→to), this animates between every value transition.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` | `number` | required | Target |
| `duration` | `number` (ms) | `500` | Per-transition |
| `easing` | `(t) => number` | `easeOutCubic` | |
| `format` | `(value) => ReactNode` | `(v) => v.toFixed(0)` | |
| `as` | tag | `'span'` | |

## Accessibility
`prefers-reduced-motion` → jump to new value instantly.

## Dependencies
Foundation: `utils`.
