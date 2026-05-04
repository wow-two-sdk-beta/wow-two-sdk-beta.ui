# Button

> **Behavioral contract:** [`Button.standard.md`](./Button.standard.md)

## Anatomy

```
<button | as>                      ← root (native button OR child element via asChild)
  ├── leading?       (slot)        ← icon, spinner
  ├── children                     ← label / arbitrary phrasing content
  └── trailing?       (slot)       ← icon, count badge, caret
</button>
```

When `loading=true`: the spinner replaces the **leading** slot (or appears at the start if no `leading` is set). When `loadingText` is provided, it replaces `children`.

## Style axes

Two independent axes — `variant × tone`. Pattern borrowed from Mantine and Radix Themes; computed from theme tokens, not enumerated. See [Standard rules 6–8, 16](./Button.standard.md#composition).

**`variant`** — visual treatment:

| Value | Description |
|---|---|
| `solid` (default) | Filled background, contrasting text. Highest visual weight. |
| `soft` | Lightly-tinted background, tone-colored text. Mid weight. |
| `outline` | Transparent background, visible border, tone-colored text. Mid weight. |
| `ghost` | Transparent until hover, then tinted. Low weight. |
| `link` | Looks like a link (text + underline on hover). No padding/border/bg. Lowest weight. |
| `glass` | Semi-transparent inverse-bg + `backdrop-blur` + tone-colored text/icon. For buttons over images/video/unpredictable backgrounds. |

**`tone`** — semantic intent:

| Value | When to use |
|---|---|
| `primary` (default) | Default brand action |
| `neutral` | Cancel, dismiss, neutral actions |
| `danger` | Destructive — delete, remove |
| `success` | Confirm a positive action |
| `warning` | Caution-flagged action |

6 × 5 = 30 combos. All theme tokens already exist in [`src/index.css`](../../index.css) (light + dark). `glass` uses `--color-inverse` + `--color-inverse-foreground` for the surface; `tone` colors the text/icon/border on top.

## Sizing & spacing

Three independent props — preset OR custom value — so consumers stay in the design system by default but can break out cleanly.

**`size`** — preset bundle (height + horizontal padding + font + icon scale + gap + default radius):

| Value | Height (base) | Padding-x (base) | Font | Default radius |
|---|---|---|---|---|
| `xs` | 24px (1.5rem) | 8px (0.5rem) | `text-xs` | `rounded-sm` |
| `sm` | 32px (2rem) | 12px (0.75rem) | `text-sm` | `rounded-md` |
| `md` (default) | 40px (2.5rem) | 16px (1rem) | `text-sm` | `rounded-md` |
| `lg` | 48px (3rem) | 24px (1.5rem) | `text-base` | `rounded-lg` |
| `xl` | 56px (3.5rem) | 32px (2rem) | `text-base` | `rounded-lg` |

**Density CSS-var hook** ([Standard rule 21](./Button.standard.md#motion)) — height and padding utilities are expressed via `calc()` so a future `<DensityProvider>` can scale all components by overriding `--ui-density-scale`:

```ts
// md baseline becomes:
'h-[calc(2.5rem*var(--ui-density-scale,1))] px-[calc(1rem*var(--ui-density-scale,1))]'
```

Default `--ui-density-scale: 1`. Compact ≈ `0.85`; spacious ≈ `1.15`. Consumer sets the var on `:root` or any container scope.

**`padding`** — independent override, **detached from `size`**:

```ts
padding?: PaddingToken | { x?: SizeValue, y?: SizeValue }

type PaddingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type SizeValue    = string | number   // number = px; string = any CSS unit ("1rem", "12px")
```

- Preset values map to consistent token-based padding regardless of `size`.
- Object form sets `x` (horizontal) and/or `y` (vertical) independently.
- `undefined` (default) → fall back to `size`'s built-in padding.

**`radius`** — independent override, same pattern:

```ts
radius?: RadiusToken | SizeValue

type RadiusToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
```

- Preset values map to theme radius tokens.
- Number/string overrides directly (e.g. `radius={20}` → `border-radius: 20px`).
- `undefined` → fall back to `size`'s default radius.

**`shape`** — controls aspect ratio:

| Value | Effect |
|---|---|
| `default` (default) | Rectangular, padding from `size`/`padding` |
| `square` | 1:1 aspect ratio (icon-only, square edges) |
| `circle` | 1:1 + `radius='full'` (FAB-style) |

Note: rectangular icon-only buttons in dense layouts (e.g. card actions) keep `shape='default'` and rely on rectangular padding — no auto-detection.

**`fullWidth`** — `boolean`, default `false`. When `true`, button stretches to fill its container.

## Content

**`children`** — arbitrary `ReactNode`. Per HTML spec, `<button>` may contain phrasing content but NOT interactive content — no nested `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `<details>`, `<label>`. Library does not enforce this; consumer's responsibility.

**`leading` / `trailing`** — slot props (`ReactNode`) for the common "icon + text + caret" composition. When provided, layout arranges them with consistent gap from `size`. Positioned via logical CSS properties ([Standard rule 18](./Button.standard.md#internationalization)) — slot ORDER is start → end, not left → right.

**`wrap`** — `boolean`, default `false`. Long-label behavior:

| Value | Behavior |
|---|---|
| `false` (default) | Single line, truncate with ellipsis (`whitespace-nowrap` + `text-ellipsis` + `overflow-hidden`) |
| `true` | Allow wrap to multiple lines (`whitespace-normal`) |

Default is truncate because buttons appear in dense UIs (toolbars, cards, tables) where overflow is the more common failure mode. Wrap is opt-in.

## States

| State | Visual change | Behavioral change | `data-state` |
|---|---|---|---|
| `default` | per `variant × tone` | Click + keyboard active | (absent) |
| `hover` | tone shifts (variant-dependent) | — | (absent) |
| `focus-visible` | 2px ring in `--ring` color | — | (absent) |
| `active` | subtle press affordance (color-shift; transform disabled under `prefers-reduced-motion`) | — | (absent) |
| `disabled` | opacity 0.5 + `cursor-not-allowed` | Removed from focus order, no click events | `disabled` |
| `loading` | spinner replaces leading slot; `loadingText` may replace children; `forced-colors` border preserved | Click blocked, `aria-busy=true`, focus retained | `loading` |
| `skeleton` | All children + slots `visibility: hidden` (preserves box dimensions); bg becomes `bg-muted` with shimmer animation overlay | Click blocked (`pointer-events-none`), `aria-busy=true`, removed from tab order (`tabindex=-1`) | `skeleton` |

`data-state` is the observable-state attribute ([Standard rule 10](./Button.standard.md#states)) — analytics, integration tests, and CSS attribute selectors target it without prop drilling.

**`loading` vs `skeleton`** — distinct semantics ([Standard rule 9](./Button.standard.md#states)):
- `loading` = user's *action* is being processed; label remains meaningful (the action verb).
- `skeleton` = button's *definition* is awaiting backend data; label not yet meaningful (often a fetched user-name, label-from-server, etc.).
Mutually exclusive — if both are set, `skeleton` takes precedence + a dev-mode warning is emitted.

## Behavior

- **`type`** — defaults to `'button'`, NOT browser-default `'submit'` ([Standard rule 2](./Button.standard.md#behavior)).
- **Keyboard** — Enter and Space activate (native).
- **`disabled`** — native attr. Removes from focus order, suppresses click events. Sets `data-state="disabled"`.
- **`loading`** — non-native. Sets `aria-busy=true`, blocks `onClick`, replaces leading slot with inlined spinner SVG, sets `data-state="loading"`. **Does NOT set native `disabled`** ([Standard rule 4](./Button.standard.md#behavior)).
- **`loadingText`** — optional. When present + `loading=true`, replaces `children` (e.g., `"Saving…"`). No default value — consumer always supplies (i18n discipline; [Standard rule 19](./Button.standard.md#internationalization)).
- **`skeleton`** — non-native. Content-loading state — signals the button's *label* is awaiting backend data, distinct from `loading` (which signals the user's *action* is in flight). When `true`: children + leading + trailing all become `visibility: hidden` (preserves intrinsic box dimensions so the button doesn't shift layout when real content arrives), bg becomes `bg-muted` with shimmer overlay, sets `aria-busy=true`, blocks clicks via `pointer-events-none`, removes from tab order via `tabindex=-1`, sets `data-state="skeleton"`. Mutually exclusive with `loading` — if both, `skeleton` wins + dev-mode warns.
- **Form association** — native `form` attribute forwarded ([Standard rule 5](./Button.standard.md#behavior)).
- **`prefers-reduced-motion`** — press transforms (scale/translate) disabled when the media query matches; color-shift retained ([Standard rule 20](./Button.standard.md#motion)).

## Accessibility

- Renders native `<button>` (or any element via `asChild`) — keyboard, focus, role, ARIA inherited.
- **`aria-label` REQUIRED when there is no visible text** (icon-only). Library does not auto-generate ([Standard rule 12](./Button.standard.md#accessibility)).
- `aria-busy` set automatically when `loading=true`.
- Focus ring meets WCAG AA contrast on every variant × tone combo at the default theme ([Standard rule 16](./Button.standard.md#accessibility)).
- Min hit target 24×24 — `xs` meets this exactly. Touch contexts SHOULD use `sm`+ ([Standard rules 13–14](./Button.standard.md#accessibility)).
- **`forced-colors` mode**: every variant carries a `border` (1px transparent for borderless variants); `system-color` keywords preserve user color choices ([Standard rule 15](./Button.standard.md#accessibility)).
- **`ghost` and `link` on touch**: `:active` provides press feedback (touch fires `:active` on tap) ([Standard rule 17](./Button.standard.md#pointer-types)).

## Composition

**`asChild`** — `boolean`, default `false`. When `true`, Button renders as its single child element via the `Slot` primitive, merging Button's className/refs/event handlers onto it.

```tsx
{/* Render as <a> with full Button styling — semantically a link */}
<Button asChild>
  <a href="/profile">Go to profile</a>
</Button>

{/* Wrap a router link — preserves middle-click, ⌘-click, prefetch */}
<Button asChild variant="outline" tone="primary">
  <RouterLink to="/profile">Profile</RouterLink>
</Button>
```

**Content-loading via `skeleton` prop** — built-in (see Behavior). Reason for built-in (not `<Skeleton>` wrapper): content-sized buttons have no fixed width for an external Skeleton to match; built-in skeleton uses the button's actual rendered dimensions (children remain in DOM but invisible).

```tsx
<Button skeleton={!user.name}>Edit {user.name}</Button>
{/* While user.name is undefined: button renders as greyed shimmer at correct size.  */}
{/* When user.name resolves: zero layout shift, label appears.                       */}
```

**Image-overlay buttons** — use `variant="glass"` (built-in) plus className for positioning:

```tsx
<Button variant="glass" tone="neutral" shape="circle" size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
        aria-label="Favorite">
  <HeartIcon />
</Button>
```

(Future `<Overlay position="top-right" appearOn="hover">` layout helper may absorb the className boilerplate.)

**ButtonGroup** — composition rules deferred to `ButtonGroup.standard.md` / `ButtonGroup.spec.md`.

## Props summary

| Name | Type | Default | Notes |
|---|---|---|---|
| `variant` | `'solid' \| 'soft' \| 'outline' \| 'ghost' \| 'link' \| 'glass'` | `'solid'` | Visual treatment |
| `tone` | `'primary' \| 'neutral' \| 'danger' \| 'success' \| 'warning'` | `'primary'` | Semantic intent |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Preset bundle |
| `padding` | `PaddingToken \| { x?: SizeValue, y?: SizeValue }` | from `size` | Independent override |
| `radius` | `RadiusToken \| SizeValue` | from `size` | Independent override |
| `shape` | `'default' \| 'square' \| 'circle'` | `'default'` | Aspect ratio |
| `fullWidth` | `boolean` | `false` | Stretch to container |
| `leading` | `ReactNode` | — | Slot before children (logical start) |
| `trailing` | `ReactNode` | — | Slot after children (logical end) |
| `wrap` | `boolean` | `false` | Allow multi-line label |
| `loading` | `boolean` | `false` | Action-loading: spinner in leading, `aria-busy`, blocks clicks, `data-state="loading"` |
| `loadingText` | `string` | — | Replaces `children` when loading. No default — consumer supplies |
| `skeleton` | `boolean` | `false` | Content-loading: hides content, shimmer bg, `aria-busy`, `tabindex=-1`, `data-state="skeleton"`. Mutually exclusive with `loading` |
| `disabled` | `boolean` | `false` | Native attr; emits `data-state="disabled"` |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native attr (defaults to `button`, not `submit`) |
| `asChild` | `boolean` | `false` | Render as child via `Slot` |
| `...rest` | `ButtonHTMLAttributes<HTMLButtonElement>` | — | All native button attrs forwarded |

## Storybook coverage

**Parked.** See [`system/sessions/ui-beta-build/context.md`](../../../../system/sessions/ui-beta-build/context.md) — to be designed after Button implementation lands. Likely shape: playground (controls-driven) + variant×tone matrix + states matrix (with `@storybook/addon-pseudo-states`) + composition recipes (asChild as link, leading/trailing icons, fullWidth, density preview).

## Non-goals

- **No compound API** (`Button.Icon`, `Button.Label`) — slot props cover the same need with less ceremony. Compound is reserved for components with real internal structure (Card, Dialog, Menu).
- **No `as` prop** — `asChild` covers polymorphism cleanly without generics gymnastics.
- **No built-in tooltip** on icon-only — consumer wraps in Tooltip.
- **No animated press / ripple** — out of scope. Can be opt-in later via `motion` prop if a real consumer asks.
- **No automatic icon-only detection** — explicit via `shape` or `padding`.
- **No HTML-content enforcement** — phrasing-content rule is documented but not policed in code.
- **No `tabular-nums` prop** — one-class fix consumer can add via `className="tabular-nums"`.
- **No `onPress` (React Aria-style)** — native `onClick` covers 95%; doubling the API isn't worth the parity for this lib.
- **No telemetry hooks** (`performance.mark` wrapper, dev-mode render counters) — consumer wraps `onClick` for app-level analytics; observable state is exposed via `data-state` for inspection.

## Inspirations

- **Mantine Button** — `variant + color` two-axis approach; `radius` as token-or-custom; `loading` semantics.
- **Radix Themes Button** — variant taxonomy (`solid | soft | surface | outline | ghost`); `data-state` attribute pattern.
- **shadcn/ui Button** — `asChild` via Slot primitive; default `type='button'` discipline.
- **Chakra UI Button** — `loading` + `loadingText` shape.
- **Material UI Button** — `startIcon`/`endIcon` slot pattern (we use `leading`/`trailing`).
- **React Aria Button** — `aria-busy` for loading; rejected `onPress` API in favor of native `onClick`.

---

*Inline citations point at specific rule URLs. See [`Button.standard.md` — Related](./Button.standard.md#related) for broad references.*
