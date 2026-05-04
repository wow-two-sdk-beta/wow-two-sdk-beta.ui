# Carousel

## Purpose
Slide-show. Cycles through a series of slides with prev/next controls and dot indicators. Optional auto-play and loop.

## Anatomy
```
<Carousel>
  ├── Carousel.Viewport       ← clip + role="group" aria-roledescription="carousel"
  │   └── Carousel.Slides     ← flex container with translateX(-index * 100%)
  │       └── Carousel.Slide  ← per item, role="group" aria-roledescription="slide"
  ├── Carousel.Prev
  ├── Carousel.Next
  └── Carousel.Dots
       └── Carousel.Dot       ← per slide
</Carousel>
```

## Required behaviors
- `index` controlled or uncontrolled.
- Prev / Next: clamp at ends unless `loop`.
- Dots reflect active state and clicking jumps to slide.
- Keyboard: Left / Right arrow when viewport focused.
- Auto-play: setInterval; pause on hover/focus.
- Slide count derived from children at the `Slides` level (one auto-counted via context).

## Visual states
`default` · `transitioning` · `auto-playing (paused on hover)`

## Props (root)
| Name | Type | Default | Why |
|---|---|---|---|
| `index` / `defaultIndex` / `onIndexChange` | `number` | — / `0` / — | Controlled or uncontrolled. |
| `loop` | `boolean` | `false` | Wrap when reaching ends. |
| `autoPlay` | `number` (ms) | — | Interval; off when omitted. |
| `slidesCount` | `number` | derived from `Slides` children count | Set explicitly when slides are virtualised. |

## Composition model
Compound. Root provides `index`, `count`, `setIndex`, `prev`, `next`, `loop`. Subcomponents subscribe.

## Accessibility
- Viewport: `role="group" aria-roledescription="carousel"`. Optional `aria-label`.
- Slides container: `aria-live="polite"` when auto-playing is *off* (so SR reads landed slide); `aria-live="off"` while auto-playing.
- Each slide: `role="group" aria-roledescription="slide" aria-label="X of N"`.
- Prev/Next/Dot: real `<button>` with `aria-label`s.

## Dependencies
Foundation: `utils`, `icons`, `hooks/useEventListener`. No cross-domain.

## Inspirations
Embla, Splide, Swiper. Ours: a small/owned wrapper — translate-x flex + dot grid + buttons. Animation = CSS transition.
