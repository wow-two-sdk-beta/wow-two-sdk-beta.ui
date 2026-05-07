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

When `loading=true`: the spinner replaces the **leading** slot (or appears at the start if no `leadingSlot` is set). When `loadingText` is provided, it replaces `children`.

## Style axes

Two independent axes — `variant × tone`. Pattern borrowed from Mantine and Radix Themes; computed from theme tokens, not enumerated. See [Standard rules 6–8, 16](./Button.standard.md#composition).

**`variant`** — visual treatment:

| Value | Description |
|---|---|
| `solid` (default) | Filled background, contrasting text. Highest visual weight. |
| `soft` | Lightly-tinted background, tone-colored text, NO border. Mid weight. |
| `surface` | Very faintly tinted background AND visible tone-colored border. Sits between `soft` and `outline` — useful when you want both presence and structure. |
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

7 × 5 = 35 combos. All theme tokens already exist in [`src/index.css`](../../index.css) (light + dark). `glass` uses `--color-inverse` + `--color-inverse-foreground` for the surface; `tone` colors the text/icon/border on top.

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

**`isFullWidth`** — `boolean`, default `false`. When `true`, button stretches to fill its container.

**Box-size overrides** (all `SizeValue` — `number` = px, `string` = any CSS unit, all undefined by default):

| Prop | Use |
|---|---|
| `width` | Explicit fixed width. Overrides `isFullWidth` if both set. |
| `height` | Explicit fixed height. Overrides `size`'s built-in height. |
| `minWidth` | Reserve min-width so content doesn't reflow when the label morphs (`"Save" → "Saving…" → "Saved"` sequence). |
| `minHeight` | Reserve min-height — symmetric with `minWidth`. Useful when content height varies (multi-line wrap on/off). |

Together with `padding` and `radius`, these cover all four sizing modes:

| Mode | API |
|---|---|
| Standard size + auto padding | `<Button size="md">` |
| Standard size + manual padding | `<Button size="md" padding={{x: 'lg'}}>` |
| Manual size + manual padding | `<Button height={48} padding={{x: 'lg', y: 'sm'}}>` |
| Standard size + fixed dimensions (anti-reflow) | `<Button size="md" minWidth={120}>` |

Content stays centered via the base `justify-center` regardless of which mode is used.

## Content

**`children`** — arbitrary `ReactNode`. Per HTML spec, `<button>` may contain phrasing content but NOT interactive content — no nested `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `<details>`, `<label>`. Library does not enforce this; consumer's responsibility.

**`leadingSlot` / `trailingSlot`** — slot props (`ReactNode`) for the common "icon + text + caret" composition. When provided, layout arranges them with consistent gap from `size`. Positioned via logical CSS properties ([Standard rule 18](./Button.standard.md#internationalization)) — slot ORDER is start → end, not left → right.

**`isMultiline`** — `boolean`, default `false`. Long-label behavior:

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
| `isLoading` | spinner replaces leading slot; `loadingText` may replace children; `forced-colors` border preserved | Click blocked, `aria-busy=true`, focus retained | `isLoading` |
| `isSkeleton` | All children + slots `visibility: hidden` (preserves box dimensions); bg becomes `bg-muted` with shimmer animation overlay | Click blocked (`pointer-events-none`), `aria-busy=true`, removed from tab order (`tabindex=-1`) | `isSkeleton` |

`data-state` is the observable-state attribute ([Standard rule 10](./Button.standard.md#states)) — analytics, integration tests, and CSS attribute selectors target it without prop drilling.

**`isLoading` vs `isSkeleton`** — distinct semantics ([Standard rule 9](./Button.standard.md#states)):
- `isLoading` = user's *action* is being processed; label remains meaningful (the action verb).
- `isSkeleton` = button's *definition* is awaiting backend data; label not yet meaningful (often a fetched user-name, label-from-server, etc.).
Mutually exclusive — if both are set, `isSkeleton` takes precedence + a dev-mode warning is emitted.

## Behavior

- **`type`** — defaults to `'button'`, NOT browser-default `'submit'` ([Standard rule 2](./Button.standard.md#behavior)).
- **Keyboard** — Enter and Space activate (native).
- **`disabled`** — native attr. Removes from focus order, suppresses click events. Sets `data-state="disabled"`.
- **`isLoading`** — non-native. Sets `aria-busy=true`, blocks `onClick`, replaces leading slot with inlined spinner SVG, sets `data-state="loading"`. **Does NOT set native `disabled`** ([Standard rule 4](./Button.standard.md#behavior)).
- **`loadingText`** — optional. When present + `loading=true`, replaces `children` (e.g., `"Saving…"`). No default value — consumer always supplies (i18n discipline; [Standard rule 19](./Button.standard.md#internationalization)).
- **`isSkeleton`** — non-native. Content-loading state — signals the button's *label* is awaiting backend data, distinct from `isLoading` (which signals the user's *action* is in flight). When `true`: children + leading + trailing all become `visibility: hidden` (preserves intrinsic box dimensions so the button doesn't shift layout when real content arrives), bg becomes `bg-muted` with shimmer overlay, sets `aria-busy=true`, blocks clicks via `pointer-events-none`, removes from tab order via `tabindex=-1`, sets `data-state="skeleton"`. Mutually exclusive with `isLoading` — if both, `isSkeleton` wins + dev-mode warns.
- **Form association** — native `form` attribute forwarded ([Standard rule 5](./Button.standard.md#behavior)).
- **`prefers-reduced-motion`** — press transforms (scale/translate) disabled when the media query matches; color-shift retained ([Standard rule 20](./Button.standard.md#motion)).

### Press detection

Unified pointer + keyboard activation, à la React Aria. `onPressStart` / `onPressEnd` fire on the *first* event in a gesture (pointer-down OR Space/Enter keydown) and the matching end (pointer-up/cancel OR Space/Enter keyup). `e.repeat` keydown events are ignored.

```ts
onPressStart?: (event: React.PointerEvent | React.KeyboardEvent) => void
onPressEnd?:   (event: React.PointerEvent | React.KeyboardEvent) => void
```

Both fire whether or not the press completed (pointer-up outside the button still ends the press). Useful for analytics (gesture timing) and custom press feedback. Blocked when `loading | skeleton | disabled`.

### Long press

```ts
onLongPress?:    (event: React.PointerEvent) => void
longPressDelay?: number   // ms; default 500; valid range 200–300000 (5 min)
```

Triggers after the pointer is held for `longPressDelay` ms (default 500). Cancels if the user releases or the pointer leaves the button bounds before the delay. **A long-press that fires SUPPRESSES the implicit click in the same gesture** — matches React Aria's contract and the typical context-menu UX (long-pressing to open a menu shouldn't also activate the button).

`longPressDelay` is validated at runtime: values below 200ms (too easy to trigger accidentally — overlaps with normal click latency) or above 300000ms / 5 minutes (clearly a developer error) emit a dev console warning and fall back to the 500ms default. The generous upper bound accommodates any hold-to-confirm pattern — e.g. a destructive Delete button using `longPressDelay={5000}` for a deliberate 5-second hold, or multi-stage interaction patterns.

### Debounce (throttle)

```ts
debounceMs?: number   // ms; default undefined (off)
```

When set, the *first* click in a `debounceMs` window fires; subsequent clicks within the window are swallowed (functionally a *throttle* — name kept as `debounce*` for consumer familiarity). Different from `isLoading` (reactive — flipped after a click) — `debounceMs` is preventive at the gesture level. Skipped when `loading | skeleton` is active (they already block clicks).

Implemented via the `useDebounceHandler` hook, exported from [`/hooks`](../../hooks/) so consumers can throttle arbitrary handlers (form submits, custom click-outside handlers, etc.) without rebuilding the timer logic:

```tsx
import { useDebounceHandler } from '@wow-two-beta/ui/hooks';

const debouncedSubmit = useDebounceHandler(handleSubmit, 1000);
<form onSubmit={debouncedSubmit}>…</form>
```

A long-press-suppressed click does NOT advance the throttle window (the gate happens before the wrapped handler fires).

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

**Content-loading via `isSkeleton` prop** — built-in (see Behavior). Reason for built-in (not `<Skeleton>` wrapper): content-sized buttons have no fixed width for an external Skeleton to match; built-in skeleton uses the button's actual rendered dimensions (children remain in DOM but invisible).

```tsx
<Button skeleton={!user.name}>Edit {user.name}</Button>
{/* While user.name is undefined: button renders as greyed shimmer at correct size.  */}
{/* When user.name resolves: zero layout shift, label appears.                       */}
```

**Image-overlay buttons** — compose with the [`<Overlay>`](../../layout/overlay/Overlay.spec.md) layout primitive instead of hand-writing positioning + opacity classes. `<Overlay>` handles preset corners / custom insets, hover/focus-within reveal, presence-based mount/unmount, and reduced-motion-safe transitions:

```tsx
<div className="group relative">
  <img src={hero} alt="" />
  <Overlay position="top-right" appearOn="hover" transition="fade-scale">
    <Button variant="glass" shape="circle" size="sm" tone="neutral" aria-label="Favorite">
      <HeartIcon />
    </Button>
  </Overlay>
</div>
```

The previous `OverlayButton` wrapper was deleted in favor of this composition — `<Overlay>` extracts the positioning/visibility/transition concerns to a layout primitive that works with any child component (Button, Badge, Avatar, etc.).

**React 19 form auto-pending** — wire `isLoading` to `useFormStatus()`:

```tsx
import { useFormStatus } from 'react-dom';

function SubmitButton({ children }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending}>{children}</Button>;
}

<form action={serverAction}>
  <SubmitButton>Save</SubmitButton>
</form>
```

Not built-in (would force the hook on every Button instance and lock us to React 19).

**Declarative popover toggling** — Button forwards the native [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) attributes:

```tsx
<Button popoverTarget="prefs-menu" popoverTargetAction="toggle">Preferences</Button>
<div id="prefs-menu" popover>…</div>
```

No JS needed; browser handles the toggle. Falls through `...rest`.

**ButtonGroup** — composition rules deferred to `ButtonGroup.standard.md` / `ButtonGroup.spec.md`.

## Props summary

| Name | Type | Default | Notes |
|---|---|---|---|
| `variant` | `'solid' \| 'soft' \| 'surface' \| 'outline' \| 'ghost' \| 'link' \| 'glass'` | `'solid'` | Visual treatment |
| `tone` | `'primary' \| 'neutral' \| 'danger' \| 'success' \| 'warning'` | `'primary'` | Semantic intent |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Preset bundle |
| `padding` | `PaddingToken \| { x?: SizeValue, y?: SizeValue }` | from `size` | Independent override |
| `radius` | `RadiusToken \| SizeValue` | from `size` | Independent override |
| `width` | `SizeValue` | — | Explicit width override |
| `height` | `SizeValue` | — | Explicit height override |
| `minWidth` | `SizeValue` | — | Reserve min width so label changes don't reflow |
| `minHeight` | `SizeValue` | — | Reserve min height (symmetric with `minWidth`) |
| `shape` | `'default' \| 'square' \| 'circle'` | `'default'` | Aspect ratio |
| `isFullWidth` | `boolean` | `false` | Stretch to container |
| `leadingSlot` | `ReactNode` | — | Slot before children (logical start) |
| `trailingSlot` | `ReactNode` | — | Slot after children (logical end) |
| `isMultiline` | `boolean` | `false` | Allow multi-line label |
| `isLoading` | `boolean` | `false` | Action-loading: spinner in leading, `aria-busy`, blocks clicks, `data-state="loading"` |
| `loadingText` | `string` | — | Replaces `children` when loading. No default — consumer supplies |
| `isSkeleton` | `boolean` | `false` | Content-loading: hides content, shimmer bg, `aria-busy`, `tabindex=-1`, `data-state="skeleton"`. Mutually exclusive with `isLoading` |
| `disabled` | `boolean` | `false` | Native attr; emits `data-state="disabled"` |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native attr (defaults to `button`, not `submit`) |
| `asChild` | `boolean` | `false` | Render as child via `Slot` |
| `onPressStart` | `(event) => void` | — | Fires on press begin (pointer-down OR Space/Enter keydown) |
| `onPressEnd` | `(event) => void` | — | Fires on press end (pointer-up/cancel OR Space/Enter keyup) |
| `onLongPress` | `(event) => void` | — | Fires after `longPressDelay` ms held; suppresses next click |
| `longPressDelay` | `number` | `500` | Long-press duration (ms). Out-of-range values (< 200 or > 300000) trigger a dev warning + fall back to the default. |
| `debounceMs` | `number` | — | Throttle clicks within window — first click wins. Internally wraps `onClick` with `useDebounceHandler` (re-exported from [`/hooks`](../../hooks/) for consumer use on arbitrary handlers). |
| `...rest` | `ButtonHTMLAttributes<HTMLButtonElement>` | — | All native button attrs forwarded — form attrs, [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API), [Invoker Commands API](https://open-ui.org/components/invokers.explainer/), focus, mouse/touch events, [`inert`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert), `title`, View Transitions (`view-transition-name` via `style`), arbitrary `data-*` (except `data-state`, owned by Button) |

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

- **Mantine Button** — `variant + color` two-axis approach; `radius` as token-or-custom; `isLoading` semantics.
- **Radix Themes Button** — variant taxonomy (`solid | soft | surface | outline | ghost`); `data-state` attribute pattern.
- **shadcn/ui Button** — `asChild` via Slot primitive; default `type='button'` discipline.
- **Chakra UI Button** — `isLoading` + `loadingText` shape.
- **Material UI Button** — `startIcon`/`endIcon` slot pattern (we use `leadingSlot`/`trailingSlot`).
- **React Aria Button** — `aria-busy` for loading; rejected `onPress` API in favor of native `onClick`.

---

*Inline citations point at specific rule URLs. See [`Button.standard.md` — Related](./Button.standard.md#related) for broad references.*
