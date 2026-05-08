# CopyButton

> **Behavioral contract:** [`CopyButton.standard.md`](./CopyButton.standard.md)

## Anatomy

```
<Button variant="ghost" data-copied?="true">    ← inherited from Button + adds data-copied
  └── content                                    ← icon swap | static node | render-prop output
</Button>
```

When `copied=false` and `children` is omitted: renders `<Icon icon={Copy} size={16} />`.
When `copied=true` and `children` is omitted: renders `<Icon icon={Check} size={16} />`.
When `children` is a static node: renders that node regardless of `copied`.
When `children` is a function: renders `children({ copied, error })`.

## Style axes

CopyButton inherits `variant × tone × size × shape × padding × radius` from Button — see [`Button.spec.md`](../button/Button.spec.md) for the complete matrix. CopyButton sets only one default that diverges from Button:

| Prop | CopyButton default | Button default | Why |
|---|---|---|---|
| `variant` | `'ghost'` | `'solid'` | Copy buttons sit alongside content as secondary affordances; ghost is the conventional lowest-weight treatment ([Standard rule 6](./CopyButton.standard.md#composition)). |

All other Button props are forwarded unchanged via `{...rest}`.

## Sizing & spacing

Inherited from Button — `size`, `padding`, `radius`, `width`, `height`, `minWidth`, `minHeight`, `isFullWidth`, `shape` all behave identically. The default content (icon-only) renders at `size={16}` regardless of Button `size`; consumers can pass custom `children` for finer control.

## Content

**`children`** — three forms:

| Form | Use |
|---|---|
| Omitted | Icon-only — `Copy` icon when idle, `Check` icon when `copied=true` |
| `ReactNode` | Static content (string, JSX) regardless of state |
| `(args) => ReactNode` | Render-prop receiving `{ copied: boolean; error: Error \| null }` for state-driven swap |

**`text`** — required string written to the system clipboard on click.

**`aria-label` / `copiedAriaLabel`** — required base label + optional override while copied. See [States](#states) and [Accessibility](#accessibility).

## States

| State | Visual | `data-copied` | `aria-label` | Behavioral change |
|---|---|---|---|---|
| Idle (default) | `Copy` icon (or static / render-prop default) | absent | `aria-label` | — |
| Copied | `Check` icon (or render-prop output) | `"true"` | `copiedAriaLabel ?? aria-label` | Click during this window kicks off another copy + restarts the reset timer |
| Errored | Idle visual (or render-prop output) | absent | `aria-label` | `onError(err)` fires once on the transition; component remains interactive |

**Observability:** `data-copied="true"` is the canonical CopyButton signal ([Standard rule 8](./CopyButton.standard.md#states)). Test selectors and CSS overlays target `[data-copied]`. Distinct from Button's `data-state` which continues to reflect Button's lifecycle states (loading, skeleton, disabled) — both attributes can be present simultaneously when relevant ([Standard rule 9](./CopyButton.standard.md#states)).

## Behavior

- **Click handler** — calls `navigator.clipboard.writeText(text)` via `useClipboard`. Returns no value; promise rejection surfaces through state.
- **`resetAfter`** — default `2000` ms. After a successful copy, `copied` flips back to `false` after this many ms. Set `0` to keep `copied=true` until unmount.
- **`onError`** — called with the captured `Error` instance on each error transition (state goes `null → Error`). Fires once per transition, not per render. Memoization is NOT required — internally ref-stabilized.
- **Re-clicks during the copied window** — re-trigger the copy and restart the reset timer. No debounce, no lockout.
- **Form association** — inherited from Button. CopyButton inside a `<form>` defaults to `type="button"` (Button standard rule 2) so it doesn't accidentally submit.
- **`prefers-reduced-motion`** — inherited from Button.

## Accessibility

- **`aria-label` REQUIRED at the type level.** Compile fails without it ([Standard rule 11](./CopyButton.standard.md#accessibility)).
- **`copiedAriaLabel`** — optional override applied while `copied=true`. When omitted, `aria-label` stays stable across the state transition. Library does NOT bake any English defaults ([Standard rule 13](./CopyButton.standard.md#accessibility)).
- **Hit target / focus / forced-colors** — inherited from Button.
- **State announcement** — when `copiedAriaLabel` is provided, the change in accessible name is announced by most screen readers on the next focus / re-read. For deterministic announcement, consumers MAY pair CopyButton with their own `aria-live="polite"` region.

## Composition

```tsx
{/* Default — icon-only, ghost variant, 2s reset */}
<CopyButton text="abc123" aria-label="Copy commit hash" />

{/* Custom static label */}
<CopyButton text={apiKey} aria-label="Copy API key">
  Copy
</CopyButton>

{/* State-driven swap via render-prop */}
<CopyButton text={shareUrl} aria-label="Copy share link" copiedAriaLabel="Link copied">
  {({ copied }) => (copied ? 'Copied!' : 'Copy link')}
</CopyButton>

{/* Error handling — toast on failure */}
<CopyButton
  text={code}
  aria-label="Copy snippet"
  onError={(err) => toast.error(`Couldn't copy: ${err.message}`)}
/>

{/* Sticky copied state — never auto-resets */}
<CopyButton text={oneShotToken} aria-label="Copy token" resetAfter={0} />

{/* Inherits every Button axis — solid + danger + lg + circle for an emphasized destructive copy */}
<CopyButton
  text={destructiveCommand}
  aria-label="Copy uninstall command"
  variant="solid"
  tone="danger"
  size="lg"
  shape="circle"
/>

{/* Inside a Button-style code block toolbar */}
<div className="flex justify-between items-center">
  <pre>{code}</pre>
  <CopyButton text={code} aria-label="Copy code" />
</div>
```

## Props summary

| Name | Type | Default | Notes |
|---|---|---|---|
| `text` | `string` | — (required) | Content written to the clipboard |
| `resetAfter` | `number` (ms) | `2000` | `0` = sticky; positive = auto-reset window |
| `children` | `ReactNode \| ({copied, error}) => ReactNode` | icon swap | Static or render-prop |
| `aria-label` | `string` | — (required) | Base accessible label |
| `copiedAriaLabel` | `string` | — | Optional override while `copied=true` |
| `onError` | `(error: Error) => void` | — | Fires once per error transition |
| `variant` | (Button's variant union) | `'ghost'` | Diverges from Button's `'solid'` default |
| `...rest` | `Omit<ButtonProps, 'onClick' \| 'children' \| 'aria-label'>` | — | Every other Button axis forwarded — `tone`, `size`, `shape`, `padding`, `radius`, `width`, `height`, `isFullWidth`, `isLoading`, `isSkeleton`, `isDisabled`, `asChild`, `onPressStart` / `onPressEnd` / `onLongPress`, native button attrs, `data-*` (except `data-state` owned by Button and `data-copied` owned by CopyButton) |

## Storybook coverage

**Parked.** Existing stories will be expanded during the per-component standardization pass for stories (separate effort). Likely shape: Playground (controls-driven `aria-label`, `text`, `resetAfter`, `variant`, `tone`, `size`) + Recipes (icon-only, render-prop swap, error toast, sticky, inline-with-pre).

## Non-goals

- **No built-in toast / popover** for "Copied!" feedback. Consumer wires their own toast system if needed; CopyButton's job is the button + `data-copied` signal.
- **No clipboard read** — write-only. Reading the clipboard is a separate hook (`useClipboardRead`, not yet built).
- **No `document.execCommand('copy')` fallback** — deprecated, behaves inconsistently in iframes / cross-origin contexts. Insecure-context failures surface as `onError`.
- **No automatic icon size scaling with Button `size`** — default icon stays at 16px regardless. Consumer overrides via custom `children` if they want size-coupled icons.
- **No `onCopy` success callback** — `data-copied` + render-prop cover the observable side; an `onCopy` callback would duplicate them. Future addition if a real consumer asks (e.g. for analytics-only callers who don't render anything from `copied`).
- **No multi-line / formatted clipboard payloads** — `text` is a plain string. HTML/rich-text clipboard payloads (`ClipboardItem`) are out of scope; needs a separate `<RichCopyButton>` or hook expansion.

## Inspirations

- **Vercel's copy buttons** — ghost variant default, ~2s reset, icon swap pattern.
- **GitHub's "Copy commit hash"** — same shape; uses `<svg>` + JS state, no library.
- **Radix `Toolbar.Button` + `useClipboard` recipe** — render-prop precedent.
- **Mantine `CopyButton`** — render-prop API closely mirrored here. Mantine's `timeout` ≈ our `resetAfter`.
- **shadcn/ui copy-button recipes** — `variant="ghost" size="sm"` defaults match.

---

*Inline citations point at specific rule URLs. See [`CopyButton.standard.md` — Related](./CopyButton.standard.md#related) for broad references.*
