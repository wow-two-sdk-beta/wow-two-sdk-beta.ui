# CountUp

## Purpose
Animate a number from `from` (default 0) up to `to`. Triggers on mount, or on enter-viewport (`triggerOnView`).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `to` | `number` | required | Target |
| `from` | `number` | `0` | Start |
| `duration` | `number` (ms) | `1500` | |
| `easing` | `(t: 0..1) => 0..1` | `easeOutCubic` | |
| `format` | `(value) => ReactNode` | `(v) => v.toFixed(0)` | |
| `triggerOnView` | `boolean` | `false` | Use IntersectionObserver instead of mount |
| `as` | tag | `'span'` | |

## Accessibility
`prefers-reduced-motion` → jump to `to` immediately.

## Dependencies
Foundation: `utils`. No external libs.
