# Overlay Standard

## Subject Philosophy

An Overlay positions a child element absolutely within its nearest positioned ancestor and optionally gates its visibility on a trigger — hover, focus-within, or a controlled `isOpen` flag — with optional motion. It is the layout primitive behind image-corner buttons, card-action chevrons, focus-revealed inline actions, and any element that should sit *over* another element rather than *in flow*. Overlay does not alter what its child is — it composes onto the child via `Slot`, contributing positioning + visibility + transition styles without introducing a wrapper. **Native composition first** — by default the overlay merges its styling onto a single child element rather than wrapping in a `<div>`; the consumer's element keeps its own role, semantics, and refs. **Triggers are orthogonal** — `appearOn` controls visibility while mounted (group-hover / group-focus-within / always), `isOpen` controls mount/unmount with deferred-unmount exit transitions; both can compose without either swallowing the other. **Motion respects intent** — every transform-bearing transition strips its transform under `prefers-reduced-motion`, so a `fade-scale` becomes a pure `fade` for users with vestibular sensitivity, automatically.

## Scope

**Applies to:** the `Overlay` component in `src/layout/overlay/`.

## Standard Specification

Items use RFC 2119 keywords (MUST · SHOULD · MAY). Each item is independently verifiable. Numbering runs continuously across groups.

### Behavior

1. **MUST default `asChild` to `true`.** Overlay's primary purpose is to apply positioning + visibility styles onto an existing element; introducing a wrapper `<div>` adds DOM weight and breaks role/semantics inheritance. Consumers who genuinely want a positioning container set `asChild={false}` explicitly.

2. **MUST require its child to be a single valid React element when `asChild=true`.** When the child is not a valid element (string, fragment, multiple children) the component MUST render `null` rather than throwing — matches `Slot`'s contract.

3. **MUST forward refs to the underlying rendered element**, whether via `Slot` (`asChild=true`) or via the wrapping `<div>` (`asChild=false`).
   - Reference: [React `forwardRef`](https://react.dev/reference/react/forwardRef)

### Composition

4. **MUST treat `position` as a union of preset enum and raw inset object.** Preset values map to `position: absolute` + paired Tailwind utility classes; the inset object form `{ top, right, bottom, left }` bypasses presets and applies each side via inline `style`. Mirrors `Button`'s `padding`/`radius` pattern (preset OR raw).

5. **MUST apply `position: absolute` regardless of preset vs custom.** Overlay is by definition positioned relative to its nearest positioned ancestor; consumers SHOULD wrap the parent with `position: relative` (e.g. via Tailwind `relative`).

6. **SHOULD compose with same-domain layout primitives** (e.g. `<Frame>`, `<AspectRatio>`) rather than duplicating positioning logic. For arbitrary visual chrome around the child, the consumer adds `className`.

### States

7. **MUST emit `data-state="open"` or `data-state="closed"` on the rendered element when `isOpen` is provided.** The `data-state` attribute is the observable handle for analytics, integration tests, and CSS attribute selectors. Identical convention to Radix and Button.

8. **MUST defer unmount until the child's exit transition or animation completes when `isOpen` flips from `true` to `false`.** Implemented by composing the foundation `<Presence>` primitive — the rendered element stays in the DOM with `data-state="closed"` until `transitionend` / `animationend` fires.

9. **MUST treat `appearOn` and `isOpen` as orthogonal.** When `isOpen` is provided it controls whether the element is mounted; `appearOn` (if also set) controls visibility *while mounted*. In practice consumers pick one mode; both can coexist without conflict.

### Accessibility

10. **MUST NOT set `role`, `aria-*`, or focus management.** Overlay is presentational — the wrapped child carries its own accessibility semantics. Wrapping a `Button` in `<Overlay>` does not change the Button's role.

11. **SHOULD warn (in development) when `appearOn` is non-`'always'` but the parent does not declare `className="group"`.** The hover/focus-within variants of `appearOn` rely on Tailwind's `group` selector being on the parent. Detection: not feasible at mount time without traversing the DOM (no observable JS hook for the class), so the warning lives in `Overlay.spec.md` rather than as runtime check.

### Internationalization

12. **SHOULD prefer logical CSS properties for positioning** when extended in the future (`inset-inline-start` / `inset-inline-end` over `left` / `right`). Current preset map uses `left`/`right` directly because Tailwind v4's `start-*`/`end-*` utilities require explicit DirectionProvider context to be reliable; revisit when DirectionProvider lands as a prerequisite for Overlay.

### Motion

13. **MUST treat the default `transition` value as conditional**: `'fade'` when any visibility gating is active (`appearOn !== 'always'` OR `isOpen` provided), `'none'` otherwise. Animating an always-visible overlay has no effect.

14. **MUST honor `prefers-reduced-motion: reduce`** by stripping the transform component of every transform-bearing variant (`fade-scale`, `fade-slide-*`). The opacity component is preserved — color/opacity transitions are safe per WCAG 2.3.3.
   - Reference: [WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

15. **SHOULD support asymmetric enter/exit durations.** `transitionDuration` accepts either a number (symmetric) or `{ enter, exit }`. The implementation drives durations through CSS variables (`--ui-overlay-enter`, `--ui-overlay-exit`) so the timing override applies in pure CSS without a JS state machine.

16. **MUST NOT introduce mount-time JavaScript animation loops.** Every transition is CSS-only; the only JS state machine in play is the foundation `<Presence>` primitive's transitionend listener for deferred unmount. This bounds runtime cost to one `addEventListener` per mounted-with-isOpen overlay.

## Standard Decision Record

**Why this shape:** Overlay is the layout primitive behind every "thing on top of another thing" pattern. It must apply to *any* child component (not just buttons), keep DOM weight to zero by default (`asChild=true`), and stay CSS-driven for performance. Two orthogonal axes — visibility trigger and mount/unmount presence — cover the full design space; transitions ride atop both.

**Per item:**

- **Specification.1** — `asChild=false` adds a `<div>` whose only job is to carry classes, multiplying DOM nodes for no semantic gain. Defaulting to true matches the most common use (overlaying a single button/icon/badge); the escape hatch exists for consumers who genuinely need a positioning container around multiple elements.
- **Specification.2** — Throwing on non-element children would crash trees during dev (especially under conditional rendering); returning `null` matches `Slot`'s contract and lets consumers iterate without paranoid guards.
- **Specification.3** — Refs must reach the actual DOM node (for measurement, focus, scroll-into-view); composing through Slot + Presence is the only way to support both `asChild` and `isOpen` simultaneously.
- **Specification.4** — Locking the union shape against Button's existing pattern keeps the mental model tight; consumers who already know Button's `padding={{x,y}}` pattern guess Overlay's `position={{top,right}}` correctly.
- **Specification.5** — Restating because it's the most common consumer footgun (rendering an Overlay inside a non-positioned parent → element jumps to viewport corner). Cannot be enforced without DOM inspection at mount; documented + included in spec gotchas.
- **Specification.6** — Deferred to spec; this rule reserves the principle so future layout primitives (`<Frame>`, `<AspectRatio>`, `<Sticky>`) compose cleanly.
- **Specification.7** — `data-state` is the de-facto cross-library convention. Cannot be added later without breaking consumer CSS; ships in v1.
- **Specification.8** — Without deferred unmount, exit transitions are invisible (React unmounts before CSS can run). The `<Presence>` primitive already exists in `src/primitives/`; reusing it avoids duplicating the listener-management logic and keeps Overlay tiny.
- **Specification.9** — Designed orthogonality means each prop has one job and consumers can compose without bookkeeping. The combined case (`isOpen` + `appearOn="hover"`) is rare but unambiguous: mount gating wins, then hover gating applies once mounted.
- **Specification.10** — Layout primitives must not impose semantics. If Overlay set `role="presentation"` or anything similar, wrapping a Button would silently strip the Button's button-role. Stay invisible to a11y APIs; let the child carry its own contract.
- **Specification.11** — Runtime detection via DOM walk is technically feasible but adds cost on every mount; doc-only is the cheaper compliance path. Revisit if the precondition turns out to be a frequent consumer error in real usage.
- **Specification.12** — Skipping logical properties for v1 is a tactical decision: `start-*`/`end-*` rely on the runtime direction context being correct, which the lib hasn't audited end-to-end. Once DirectionProvider lands library-wide, switch the preset map.
- **Specification.13** — A `transition` value of anything other than `'none'` on `appearOn="always"` (no `isOpen`) does nothing because there is no state to transition. Defaulting smartly avoids a "why isn't my transition firing?" footgun.
- **Specification.14** — Vestibular disorders are aggravated by transforms, not opacity. The Tailwind `motion-reduce:` modifier composes statically into the variants config; consumers cannot accidentally bypass it by overriding `transition`.
- **Specification.15** — The CSS-var indirection (`--ui-overlay-enter`, `--ui-overlay-exit`) lets a single static class set drive both enter and exit timings. Without the indirection we'd need either inline-style toggling (JS state) or a separate class per duration. The CSS-var path keeps the variants configuration declarative.
- **Specification.16** — Pure-CSS motion runs on the compositor thread; JS animation loops compete with React renders. This rule keeps Overlay cheap enough that it can ship on every card / list item without measurable cost.

## Related

Inline citations above point at specific rule URLs. This section lists umbrella references.

- Cross-cutting conventions: [`docs/common-standards.md`](../../../docs/common-standards.md) — naming (`is*` / `*Slot`), comment style, displayName, magic-value extraction.
- WCAG 2.2 — https://www.w3.org/WAI/WCAG22/quickref/
- MDN `prefers-reduced-motion` — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Foundation primitive: [`src/primitives/presence/Presence.tsx`](../../primitives/presence/Presence.tsx) — deferred unmount behind `data-state`.
- Foundation primitive: [`src/primitives/slot/Slot.tsx`](../../primitives/slot/Slot.tsx) — child-merging for `asChild`.
- Sibling layout primitives: `<AspectRatio>`, `<Frame>` — same domain, complementary usage.
