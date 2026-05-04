# OverlayButton

> **Behavioral contract:** delegated to [`Button.standard.md`](../button/Button.standard.md). OverlayButton is a thin wrapper that hardcodes `variant="glass"` + `shape="circle"` and adds positioning + reveal-on-hover.

## Purpose

Icon button positioned absolutely over its parent — image-overlay actions (zoom, edit, favorite, close), card-corner controls. Glass surface ensures legibility over arbitrary backgrounds (images, video, color blocks).

## Anatomy

```
<Button variant="glass" shape="circle">     ← inherited from Button
  ├── (positioning classes)                  ← OverlayButton adds: absolute + corner
  └── (visibility classes)                   ← OverlayButton adds: opacity gate
</Button>
```

## Props

| Name | Type | Default | Notes |
|---|---|---|---|
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left' \| 'center'` | `'top-right'` | Anchor relative to positioned parent |
| `appearOn` | `'always' \| 'hover'` | `'always'` | When `'hover'`, parent MUST have `className="group"` |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'sm'` | Inherited from Button |
| `tone` | `'primary' \| 'neutral' \| 'danger' \| 'success' \| 'warning'` | `'neutral'` | Inherited (mostly cosmetic for glass — see Button) |
| `aria-label` | `string` | — (REQUIRED) | Icon-only buttons need a label |
| `...rest` | `Omit<ButtonProps, 'variant' \| 'shape'>` | — | All Button props except variant + shape (which are locked) |

## Composition

```tsx
{/* Always-visible favorite button on a listing card */}
<div className="relative">
  <img src={hero} alt="" />
  <OverlayButton aria-label="Favorite" position="top-right">
    <HeartIcon />
  </OverlayButton>
</div>

{/* Reveal-on-hover edit button — parent needs `group` */}
<div className="relative group">
  <img src={hero} alt="" />
  <OverlayButton aria-label="Edit" position="top-left" appearOn="hover">
    <PencilIcon />
  </OverlayButton>
</div>

{/* Anything else Button supports — loading, skeleton, etc. */}
<OverlayButton aria-label="Saving" loading position="center">
  <SaveIcon />
</OverlayButton>
```

## Non-goals

- **No variant override** — OverlayButton is `glass` by definition; if you need a different variant for an absolutely-positioned button, use `<Button variant="..." className="absolute top-2 right-2">` directly.
- **No shape override** — circle by definition. Same workaround as above.
- **No layout positioning beyond corners + center** — for arbitrary positions (custom offsets, multiple stacked), use Button + className. A future `<Overlay>` layout primitive may absorb this.

## Inspirations

- Mantine `ActionIcon` — closest equivalent, no glass.
- Card-action patterns from haven, common e-commerce listing UIs.
