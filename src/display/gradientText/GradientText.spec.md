# GradientText

## Purpose
Text with a gradient color fill via `background-clip: text`. Optional animated gradient shift.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `from` / `via` / `to` | `string` (CSS color) | brand defaults | Gradient stops |
| `direction` | `'r' \| 'l' \| 't' \| 'b' \| 'tr' \| 'br' \| 'tl' \| 'bl'` | `'r'` | Gradient direction |
| `animated` | `boolean` | `false` | Pan the gradient horizontally on a 4s loop |
| `as` | `'span' \| 'div' \| 'h1'..'h6' \| 'p'` | `'span'` | Tag |

## Accessibility
Decorative effect only — text content remains accessible. Honors `prefers-reduced-motion` (drops animation).

## Dependencies
Foundation: `utils`. No external libs.
