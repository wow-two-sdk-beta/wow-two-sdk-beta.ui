# Backdrop

## Purpose
Raw scrim primitive — fixed-position, full-viewport, semi-transparent layer. Used as the dimming/blocking surface behind `Dialog`, `Drawer`, and `LoadingOverlay`. Public so consumers can build their own custom overlays.

## Anatomy
Single `<div>` rendered into a Portal. No children layout — purely visual.

## Required behaviors
- `open` toggles render. Conditional mount (no animation primitive yet — fade-in/out via CSS animation classes).
- `onClick` on the backdrop fires (consumers wire dismissal).
- Click-through option: `pointerEvents="none"` for non-blocking modes.
- Always portaled to `document.body` (escapes z-index stacking contexts).

## Visual states
`open` (default visible) · `pointerEvents-none` (click-through)

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `open` | `boolean` | `true` | no | Control mount. |
| `blur` | `boolean` | `false` | no | Apply `backdrop-blur-sm`. |
| `pointerEvents` | `'auto' \| 'none'` | `'auto'` | no | When `none`, clicks pass through. |
| `onClick` | `(e) => void` | — | no | Click-on-scrim handler. |

## Composition
Plain wrapper. `Dialog`/`Drawer` use it internally; consumers can use it standalone.

## Dependencies
Foundation: `utils/cn`. Primitives: `Portal`.

## Known limitations
- No animation orchestration yet (deferred to a later L2 `Presence` consumer).
- Always full-viewport (`inset-0`); no anchored variant.

## Inspirations
- Mantine `Overlay`.
- MUI `Backdrop`.
