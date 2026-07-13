# Overlay

> **Behavioral contract:** [`Overlay.standard.md`](./Overlay.standard.md)

Layout primitive that absolutely-positions a child within its nearest positioned ancestor, with optional reveal-on-hover/focus and mount/unmount transitions. Intentionally presentational — applies to any component (Button, Badge, Avatar, Icon, Image label, anything).

## Anatomy

```
<positioned ancestor>             ← consumer's element with `position: relative` + (optional) `className="group"`
  └── <Overlay>                   ← merges absolute positioning + visibility + transition styles onto its child
        └── <child element />     ← the actual rendered DOM (button, badge, icon, etc.)
```

When `asChild=true` (default): no wrapper rendered; styles merge onto the child via `Slot`.
When `asChild=false`: a `<div>` is rendered around the child carrying the styles.

## Style axes

Three independent axes — `position × appearOn × transition`. Each prop has one job; the visibility trigger and the motion are orthogonal.

### `position` — anchor location

Preset values:

| Value | Resolves to |
|---|---|
| `top-right` (default) | `top: <inset>; right: <inset>` |
| `top-left` | `top: <inset>; left: <inset>` |
| `bottom-right` | `bottom: <inset>; right: <inset>` |
| `bottom-left` | `bottom: <inset>; left: <inset>` |
| `top` | `top: <inset>; left: 50%; translateX(-50%)` |
| `bottom` | `bottom: <inset>; left: 50%; translateX(-50%)` |
| `left` | `left: <inset>; top: 50%; translateY(-50%)` |
| `right` | `right: <inset>; top: 50%; translateY(-50%)` |
| `center` | `top: 50%; left: 50%; translate(-50%, -50%)` |

Object form: `{ top?, right?, bottom?, left? }` — each side becomes inline `style`. Mirrors `Button`'s `padding?: PaddingToken \| { x, y }` pattern.

```tsx
<Overlay position="top-right">…</Overlay>          {/* preset */}
<Overlay position={{ top: 16, right: 24 }}>…</Overlay>  {/* raw inset */}
<Overlay position={{ bottom: '1rem' }}>…</Overlay>      {/* partial */}
```

### `inset` — preset spacing override

`SizeValue` (number = px, string = any CSS unit). Default `'0.5rem'`. Applied to all preset positions through the `--ui-overlay-inset` CSS variable. Ignored when `position` is an object.

```tsx
<Overlay position="top-right" inset="1rem">  {/* corners now 1rem off the edge */}
<Overlay position="bottom-left" inset={20}>  {/* 20px */}
```

### `appearOn` — visibility trigger while mounted

| Value | Behavior |
|---|---|
| `always` (default) | Element is visible at all times. |
| `hover` | Element is hidden (`opacity: 0`) until parent is `:hover` OR `:focus-within`. **Parent MUST have `className="group"`.** |
| `focus-within` | Element is hidden until parent is `:focus-within` only (no hover trigger). **Parent MUST have `className="group"`.** |

`focus-within` is included alongside `hover` because keyboard users have no hover state — `hover` already includes a focus-within fallback so the keyboard path works; `focus-within` is for cases where you want focus-only reveal (forms, accessibility-specific actions).

### `isOpen` — controlled mount/unmount

`boolean | undefined`. When `undefined` (default), Overlay renders unconditionally and `appearOn` controls visibility. When provided, Overlay is wrapped in the `<Presence>` primitive:

| `isOpen` | Result |
|---|---|
| `true` | Element is mounted with `data-state="open"`. Enter transition plays from current hidden state. |
| `false` | Element receives `data-state="closed"`. Exit transition plays. **Element stays mounted until `transitionend`/`animationend` fires**, then unmounts. |
| `undefined` | No presence machinery; element renders unconditionally per `appearOn`. |

`isOpen` and `appearOn` are orthogonal — `isOpen` controls whether the element is in the DOM, `appearOn` controls whether it's visible while in the DOM. The combined case is rare but well-defined: mount gating wins, then hover gating layers on.

### `transition` — show/hide animation

| Value | Effect |
|---|---|
| `none` | No transition. Default when no visibility gating is active. |
| `fade` (auto-default with gating) | Opacity 0 ↔ 1 |
| `fade-scale` | Opacity + `scale(0.95 → 1)` |
| `fade-slide-up` | Opacity + `translateY(4px → 0)` |
| `fade-slide-down` | Opacity + `translateY(-4px → 0)` |
| `fade-slide-left` | Opacity + `translateX(4px → 0)` |
| `fade-slide-right` | Opacity + `translateX(-4px → 0)` |

The default is computed: `'fade'` when `appearOn !== 'always'` OR `isOpen` is provided, else `'none'`.

### `transitionDuration` — symmetric or asymmetric

```ts
transitionDuration?: number | { enter?: number; exit?: number };  // ms; default 200
```

Number form: same duration both directions.
Object form: independent enter/exit (e.g. `{ enter: 150, exit: 350 }` for a fast-in/leisurely-out reveal).

Implemented via two CSS variables (`--ui-overlay-enter`, `--ui-overlay-exit`) consumed by the variants config — no JS state machine.

### `transitionEasing`

CSS timing function string. Default `'ease-out'`. Set on inline `style.transitionTimingFunction`, overrides the variants config's class.

## States

| Visibility trigger | DOM state | Visual state |
|---|---|---|
| `appearOn="always"` | Always mounted | Always visible |
| `appearOn="hover"` | Always mounted | `opacity: 0` at rest; `opacity: 1` when ancestor `:hover` or `:focus-within` |
| `appearOn="focus-within"` | Always mounted | `opacity: 0` at rest; `opacity: 1` when ancestor `:focus-within` |
| `isOpen={true}` | Mounted, `data-state="open"` | Visible (opacity 1, transform identity) |
| `isOpen={false}` | Mounted briefly during exit transition, then unmounts | `data-state="closed"` (opacity 0, transform offset) |

`data-state` is the observable handle ([Standard rule 7](./Overlay.standard.md#states)) for analytics, integration tests, and consumer CSS.

## Behavior

- **`asChild`** — defaults to `true`. The child element receives Overlay's positioning + visibility + transition classes via `Slot`. No wrapper div.
- **`asChild={false}`** — Overlay renders a `<div>` that carries the styles around the child(ren).
- **Refs** — forwarded to the rendered element (Slot's child OR the wrapping div).
- **Presence** — `isOpen` triggers wrapping in the foundation `<Presence>` primitive ([`src/primitives/presence/`](../../primitives/presence/)). On `isOpen=false`, `data-state="closed"` is set; element is unmounted only after the next `transitionend`/`animationend`.
- **Reduced motion** — every transform-bearing transition (`fade-scale`, `fade-slide-*`) strips its transform under `prefers-reduced-motion: reduce` via Tailwind's `motion-reduce:` modifier. Opacity is preserved. No JS branching needed.
- **z-index** — defaults to `10`. Override via `zIndex` prop or stacking-context-aware className.

## Accessibility

- **No imposed roles or `aria-*`** ([Standard rule 10](./Overlay.standard.md#accessibility)). Overlay is presentational; the child (Button, Badge, Icon, etc.) carries its own a11y semantics.
- **Required parent class** — `appearOn="hover"` and `appearOn="focus-within"` rely on Tailwind's `group` selector. Parent MUST have `className="group"` for the trigger to fire ([Standard rule 11](./Overlay.standard.md#accessibility)). Detection at runtime is not currently implemented.
- **Keyboard reveal** — `appearOn="hover"` includes `group-focus-within:opacity-100` so keyboard users see the reveal when focus lands on a focusable child of the parent group; `appearOn="focus-within"` is the focus-only variant for cases where hover reveal isn't desired.

## Composition

```tsx
{/* Always-visible favorite button on a listing card */}
<div className="relative">
  <img src={hero} alt="" />
  <Overlay position="top-right">
    <Button variant="glass" shape="circle" size="sm" tone="neutral" aria-label="Favorite">
      <HeartIcon />
    </Button>
  </Overlay>
</div>

{/* Reveal-on-hover edit button — parent needs `group` */}
<div className="group relative">
  <img src={hero} alt="" />
  <Overlay position="top-left" appearOn="hover" transition="fade-scale">
    <Button variant="glass" shape="circle" size="sm" tone="neutral" aria-label="Edit">
      <PencilIcon />
    </Button>
  </Overlay>
</div>

{/* Controlled mount/unmount with asymmetric durations */}
<Overlay
  isOpen={isEditing}
  position="bottom-right"
  transition="fade-slide-up"
  transitionDuration={{ enter: 150, exit: 350 }}
>
  <Toolbar>…</Toolbar>
</Overlay>

{/* Custom inset for fine positioning */}
<Overlay position={{ top: 12, right: 24 }}>
  <Badge tone="success">New</Badge>
</Overlay>

{/* Non-Slot mode — wrapper div around multiple children */}
<Overlay asChild={false} position="bottom-left" className="rounded bg-black/60 px-2 py-1 text-xs text-white">
  <span className="size-2 rounded-full bg-red-500 inline-block mr-1" />
  Live
</Overlay>
```

## Props summary

| Name | Type | Default | Notes |
|---|---|---|---|
| `position` | `OverlayPosition` (preset \| `{top,right,bottom,left}`) | `'top-right'` | Anchor location |
| `inset` | `SizeValue` | `'0.5rem'` | Preset spacing — ignored for object position |
| `zIndex` | `number \| string` | `10` | Stack order |
| `appearOn` | `'always' \| 'hover' \| 'focus-within'` | `'always'` | Visibility while mounted; hover/focus-within require parent `group` |
| `isOpen` | `boolean` | — | Controlled mount/unmount; activates Presence |
| `transition` | `OverlayTransition` | auto: `'fade'` if gating else `'none'` | Show/hide animation |
| `transitionDuration` | `number \| {enter?, exit?}` | `200` | Symmetric or asymmetric |
| `transitionEasing` | `string` | `'ease-out'` | CSS timing function |
| `asChild` | `boolean` | `true` | Render as child via Slot (no wrapper) |
| `className` | `string` | — | Merged onto child or wrapper |
| `style` | `CSSProperties` | — | Merged onto child or wrapper |
| `children` | `ReactNode` | — | When `asChild=true`, must be a single React element |

## Storybook coverage

`Layout/Overlay` — Playground (controls-driven) + named stories for every visibility/transition combination:

- `AlwaysVisible`, `Center`, `CustomInset` — positioning
- `HoverReveal`, `FocusWithinReveal` — visibility triggers
- `HoverFadeSlideUp`, `AsymmetricDurations` — transition variants
- `PresenceMount` — `isOpen` toggle with deferred unmount
- `NotSlotMode` — `asChild={false}` wrapper-div mode

## Non-goals

- **No mount-time animation loops.** Pure CSS only; the only JS in play is `<Presence>`'s transitionend listener for deferred unmount.
- **No spring physics.** Spring-based motion (Framer Motion-style) is a separate motion model; deferred until a drag-driven component (Drawer dismiss, swipeable carousel) actually needs it.
- **No FLIP / animated layout shift.** Layout-shift animations are a different problem; will land as `<AnimatedLayout>` or `useFlip` separately.
- **No portal.** Overlay positions within the nearest positioned ancestor — when consumers need viewport-anchored or `<body>`-rooted overlays they compose with the existing `<Portal>` primitive.
- **No imposed semantics.** Overlay does not set `role`, `aria-*`, focus management — child element owns those.
- **No runtime check for parent `group` class.** Documented precondition; revisit if it becomes a frequent consumer error.

## Inspirations

- **Mantine `ActionIcon` overlay positioning** — preset corner pattern.
- **Radix `Presence`** — `data-state` + deferred unmount; foundation primitive used here.
- **Floating UI** — anchor-positioning model (used elsewhere via `<AnchoredPositioner>` primitive); Overlay is the simpler ancestor-anchored case.
- **shadcn / Radix Dialog `data-[state=open|closed]`** — observable state attribute convention.

---

*Inline citations point at specific rule URLs. See [`Overlay.standard.md` — Related](./Overlay.standard.md#related) for broad references.*
