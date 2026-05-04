# ScrollReveal

## Purpose
Wraps children; observes when the wrapper enters the viewport via `IntersectionObserver`; toggles a `data-revealed` attribute that drives a CSS-class transition (fade/slide-in).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `effect` | `'fade' \| 'slide-up' \| 'slide-down' \| 'slide-left' \| 'slide-right' \| 'zoom'` | `'fade'` | |
| `duration` | `number` (ms) | `600` | |
| `delay` | `number` (ms) | `0` | |
| `threshold` | `number` | `0.1` | IO threshold |
| `once` | `boolean` | `true` | Reveal-then-stay vs every-time |
| `as` | tag | `'div'` | |

## Accessibility
Honors `prefers-reduced-motion`: skips animation, leaves content visible from start.

## Dependencies
Foundation: `utils`, `hooks` (none currently — uses IO directly).
