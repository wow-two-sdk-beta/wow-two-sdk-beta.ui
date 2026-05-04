# Typewriter

## Purpose
Type out text one character at a time, with a blinking caret. Optional phrase loop with delete/retype between phrases.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `text` | `string \| string[]` | required | Single text or list of phrases |
| `typeSpeed` | `number` (ms/char) | `60` | |
| `deleteSpeed` | `number` (ms/char) | `40` | |
| `pauseBetween` | `number` (ms) | `1500` | After typing a phrase |
| `loop` | `boolean` | `true` (when array) | Cycle through phrases |
| `cursor` | `boolean` | `true` | Show blinking caret |
| `cursorChar` | `string` | `'│'` | |
| `as` | tag | `'span'` | |

## Accessibility
- Output is a real text node (announced by SR as it changes).
- Honors `prefers-reduced-motion`: shows full text instantly, no animation.
- Caret is `aria-hidden`.

## Dependencies
Foundation: `utils`. Uses `blink-caret` keyframe in `src/index.css`.
