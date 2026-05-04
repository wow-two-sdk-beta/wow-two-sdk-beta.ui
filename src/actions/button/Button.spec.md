# Button

*Status: draft · Last reviewed: 2026-05-04*

## Purpose

Trigger an action — the most foundational interactive element. Use for form submission, primary CTAs, secondary actions, dismissals, and any "do a thing now" affordance.

- Use **Button** when the affordance is "do a thing now."
- Use a **Link** component (TBD) when the affordance is "navigate somewhere" — or use `asChild` to render Button as `<a>` (see Composition).

## Anatomy

```
<button | as>                      ← root (native button OR child element via asChild)
  ├── leading?       (slot)        ← icon, spinner
  ├── children                     ← label / arbitrary phrasing content
  └── trailing?      (slot)        ← icon, count badge, caret
</button>
```

When `loading=true`: a spinner replaces the **leading** slot (or appears at the start if no leading). If `loadingText` is provided, it replaces `children`.

## Style axes

Two independent axes — `variant × tone` — replace the single-enum approach. Pattern borrowed from Mantine and Radix Themes; scales to 25 combos without enumeration.

**`variant`** — visual treatment (how heavy is the affordance):

| Value | Description |
|---|---|
| `solid` (default) | Filled background, contrasting text. Highest visual weight. |
| `soft` | Lightly-tinted background, tone-colored text. Mid weight. |
| `outline` | Transparent background, visible border, tone-colored text. Mid weight. |
| `ghost` | Transparent until hover, then tinted. Low weight. |
| `link` | Looks like a link (text + underline on hover), no padding/border/bg. Lowest weight. |

**`tone`** — semantic intent (what kind of action):

| Value | When to use |
|---|---|
| `primary` (default) | Default brand action |
| `neutral` | Cancel, dismiss, neutral actions |
| `danger` | Destructive — delete, remove |
| `success` | Confirm a positive action |
| `warning` | Caution-flagged action |

5 × 5 = 25 combos, all computed from theme tokens. **Token gap to address**: `--success-*` and `--warning-*` are not yet in the shadcn-aligned theme — implementation step adds them before this spec ships.

## Sizing & spacing

Three independent props — preset OR custom value — so consumers stay in the design system by default but can break out cleanly.

**`size`** — preset bundle (height + horizontal padding + font + icon scale + gap + default radius):

| Value | Height | Default padding-x | Font | Default radius |
|---|---|---|---|---|
| `xs` | 24px | `px-2` | `text-xs` | `rounded-sm` |
| `sm` | 32px | `px-3` | `text-sm` | `rounded-md` |
| `md` (default) | 40px | `px-4` | `text-sm` | `rounded-md` |
| `lg` | 48px | `px-6` | `text-base` | `rounded-lg` |
| `xl` | 56px | `px-8` | `text-base` | `rounded-lg` |

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

**`shape`** — controls aspect ratio for icon-only and pill use cases:

| Value | Effect |
|---|---|
| `default` (default) | Rectangular, padding from `size`/`padding` |
| `square` | 1:1 aspect ratio (icon-only, square edges) |
| `circle` | 1:1 + `radius='full'` (FAB-style) |

Note: rectangular icon-only buttons in dense layouts (e.g. card actions) keep `shape='default'` and rely on rectangular padding — no auto-detection.

**`fullWidth`** — `boolean`, default `false`. When `true`, button stretches to fill its container.

## Content

**`children`** — arbitrary `ReactNode`. Per HTML spec, `<button>` may contain **phrasing content but NOT interactive content** — no nested `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `<details>`, `<label>`. Library does not enforce this — consumer's responsibility.

**`leading` / `trailing`** — slot props (`ReactNode`) for the common "icon + text + caret" composition. When provided, layout arranges them with consistent gap from `size`.

**`wrap`** — `boolean`, default `false`. Controls long-label behavior:

| Value | Behavior |
|---|---|
| `false` (default) | Single line, truncate with ellipsis (`whitespace-nowrap` + `text-ellipsis` + `overflow-hidden`) |
| `true` | Allow wrap to multiple lines (`whitespace-normal`) |

Default is truncate because buttons appear in dense UIs (toolbars, cards, tables) where overflow is the more common failure mode. Wrap is opt-in.

## States

| State | Visual change | Behavioral change |
|---|---|---|
| `default` | per `variant × tone` | Click + keyboard active |
| `hover` | tone shifts (variant-dependent) | — |
| `focus-visible` | 2px ring in `--ring` color | — |
| `active` | subtle press affordance (slight bg-darken or scale) | — |
| `disabled` | opacity 0.5 + `cursor-not-allowed` | Removed from focus order, no click events |
| `loading` | spinner replaces leading slot; `loadingText` may replace children | Click blocked, `aria-busy=true`, focus retained |

## Behavior

- **`type`** — defaults to `'button'` (NOT browser-default `'submit'`). Must be `'submit'` explicitly to submit a form. Prevents the most common React form bug.
- **Keyboard** — Enter and Space activate (native).
- **`disabled`** — native attr. Removes from focus order, suppresses click events.
- **`loading`** — non-native. Sets `aria-busy=true`, blocks `onClick`, replaces leading slot with inline spinner. Spinner is an inlined SVG (no dependency on `feedback/spinner`) — keeps the atom standalone.
- **`loadingText`** — optional. When present + `loading=true`, replaces `children` (e.g., "Saving…").
- **Form association** — native `form` attribute forwarded.

## Accessibility

- Renders native `<button>` (or any element via `asChild`) — keyboard, focus, role, ARIA inherited.
- **`aria-label` is REQUIRED when there is no visible text** (icon-only). Library does not auto-generate this.
- `aria-busy` set automatically when `loading=true`.
- Focus ring meets WCAG AA contrast on every variant × tone combo at the default theme.
- Min hit target 24×24 (WCAG 2.2 SC 2.5.8) — `xs` meets this exactly. Icon-only buttons should generally use `sm` or larger to give comfortable target area.

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

Why include in v1: avoids maintaining a parallel `LinkButton`, gives semantic correctness for navigation buttons, and integrates cleanly with router/Next.js links. Implementation uses `primitives/slot` (already in foundation).

**ButtonGroup** — composition rules deferred to ButtonGroup.spec.md.

## Props summary

| Name | Type | Default | Notes |
|---|---|---|---|
| `variant` | `'solid' \| 'soft' \| 'outline' \| 'ghost' \| 'link'` | `'solid'` | Visual treatment |
| `tone` | `'primary' \| 'neutral' \| 'danger' \| 'success' \| 'warning'` | `'primary'` | Semantic intent |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Preset bundle |
| `padding` | `PaddingToken \| { x?: SizeValue, y?: SizeValue }` | from `size` | Independent override |
| `radius` | `RadiusToken \| SizeValue` | from `size` | Independent override |
| `shape` | `'default' \| 'square' \| 'circle'` | `'default'` | Aspect ratio |
| `fullWidth` | `boolean` | `false` | Stretch to container |
| `leading` | `ReactNode` | — | Slot before children |
| `trailing` | `ReactNode` | — | Slot after children |
| `wrap` | `boolean` | `false` | Allow multi-line label |
| `loading` | `boolean` | `false` | Replaces leading w/ spinner, blocks clicks |
| `loadingText` | `string` | — | Replaces children when loading |
| `disabled` | `boolean` | `false` | Native attr |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native attr (defaults to button, not submit) |
| `asChild` | `boolean` | `false` | Render as child via Slot |
| `...rest` | `ButtonHTMLAttributes<HTMLButtonElement>` | — | All native button attrs forwarded |

## Storybook coverage

**Parked.** See [`system/sessions/ui-beta-build/context.md`](../../../../system/sessions/ui-beta-build/context.md) — to be designed after Button implementation lands. Likely shape: playground (controls-driven) + variant×tone matrix + states matrix (with `@storybook/addon-pseudo-states`) + composition recipes.

## Non-goals (explicit)

- **No compound API** (`Button.Icon`, `Button.Label`) — slot props cover the same need with less ceremony. Compound is reserved for components with real internal structure (Card, Dialog, Menu).
- **No built-in tooltip** on icon-only — consumer wraps in Tooltip.
- **No animated press / ripple** — out of scope. Can be opt-in later via `motion` prop if a real consumer asks.
- **No automatic icon-only detection** — explicit via `shape` or `padding`.
- **No generic `as` prop** — `asChild` covers polymorphism cleanly without generics gymnastics.
- **No HTML-content enforcement** — phrasing-content rule is documented but not policed in code.

## Inspirations

- **Mantine Button** — `variant + color` two-axis approach; `radius` as token-or-custom.
- **Radix Themes Button** — variant taxonomy (`solid | soft | surface | outline | ghost`); inspired ours.
- **shadcn/ui Button** — `asChild` via Slot; default `type='button'` discipline.
- **Chakra UI Button** — loading state semantics (`loading` + `loadingText`).
- **Material UI Button** — `startIcon`/`endIcon` slot pattern (we use `leading`/`trailing`).
