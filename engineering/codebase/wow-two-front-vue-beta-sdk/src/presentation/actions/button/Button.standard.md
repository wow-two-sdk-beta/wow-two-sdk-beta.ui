# Button Standard

## Subject Philosophy

A Button triggers an action — the click that submits a form, dismisses a dialog, confirms a choice. It is the primary verb of a user interface: "do this thing now." The contract a Button makes with the user is immediacy — pressing it produces a visible response within the same render cycle — and destructive operations are guarded by an AlertDialog rather than swallowed silently. Use a Button when the affordance is action; use a Link when the affordance is navigation. The space of variations a Button must accommodate is large — visual weight, semantic intent, size, density, polymorphism for navigation contexts. The space of behaviors it must guarantee is narrow but absolute — keyboard activation, screen-reader semantics, focus visibility, motion-respect, observable state. **Native semantics first** — render a real `<button>` (or compose onto another element via `Slot`) so the platform handles role, focus, and keyboard for free. **Two orthogonal style axes** — appearance (`variant`) and intent (`tone`) compose; the matrix is computed from theme tokens, not enumerated. **Behavior over decoration** — what a Button does is contract; how it looks is configuration.

## Scope

**Applies to:** the `Button` component in `src/actions/button/`.

## Standard Specification

Items use RFC 2119 keywords (MUST · SHOULD · MAY). Each item is independently verifiable. Numbering runs continuously across groups. Inline citations point at the specific rule URL; broad references live in `Related`.

### Behavior

1. **MUST render a native `<button>` element by default.** When `asChild=true`, MUST compose onto the child element via `Slot` (preserving event handlers and ref).
   - Reference: [HTML Living Standard — `<button>`](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element)

2. **MUST default `type` to `"button"`, NOT `"submit"`.** Prevents the most-cited React form bug where any button inside a `<form>` accidentally submits.

3. **MUST activate on Enter and Space.** Inherited from native `<button>`; library does not override this behavior.

4. **MUST set `aria-busy="true"` and block `onClick` when `isLoading={true}`, AND MUST NOT forward `isLoading` (or `isSkeleton`) to the native `disabled` attribute.** Native `disabled` removes the element from focus order and suppresses screen-reader state announcements. To announce the inert-while-loading state without losing focusability, the component **MUST also set `aria-disabled="true"`** whenever `isLoading` or `isSkeleton` is active. When `loadingText` is omitted, the original `children` **MUST be preserved in an `sr-only` span** alongside the (`aria-hidden`) spinner so the button's accessible name survives; when `loadingText` is provided, it supplies the name instead.
   - Reference: [WAI-ARIA `aria-busy`](https://www.w3.org/TR/wai-aria-1.2/#aria-busy), [WAI-ARIA `aria-disabled`](https://www.w3.org/TR/wai-aria-1.2/#aria-disabled)

5. **MUST forward the `form` attribute** to support submit-from-outside-form patterns (e.g. modal forms with footer actions in a separate DOM subtree).
   - Reference: [HTML — `button.form`](https://html.spec.whatwg.org/multipage/form-elements.html#attr-fae-form)

### Composition

6. **MUST polymorphism via `asChild` (Slot pattern); MUST NOT expose a generic `as` prop.** `Slot` is structurally typed via children; `as` requires generics that break inference for arbitrary element types.

7. **MUST expose `leading` and `trailing` slot props for icon composition; MUST NOT expose a compound API (`Button.Icon`, `Button.Label`).** Button has no nameable internal structure beyond decorations — slot props match the actual mental model with less ceremony.

8. **The default loading indicator MUST come from the foundation `icons/Spinner` primitive (not from `feedback/spinner`).** When `loadingSlot` is provided, that slot wins. Atom-rule convention: Button consumes only foundation utilities + same-domain components.

### States

9. **MUST distinguish `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `skeleton` with visually distinct presentations** at the default theme. `hover` and `focus-visible` MUST NOT be visually identical. `isLoading` (action-loading: user's action in flight, label is meaningful) and `isSkeleton` (content-loading: button definition awaiting backend data, label is not yet meaningful) MUST NOT be visually identical AND MUST be treated as mutually exclusive — if both `isLoading={true}` and `isSkeleton={true}`, `isSkeleton` MUST take precedence and a dev-mode warning MUST be emitted.

10. **MUST emit a `data-state` attribute reflecting current observable state.** Values: `loading` (when `isLoading={true}`), `skeleton` (when `isSkeleton={true}`), `disabled` (when `isDisabled={true}` and neither loading nor skeleton), absent otherwise. Lets analytics scrapers, integration tests, visual-regression suites, and custom CSS overlays target state without prop drilling. Values match the `ButtonDataState` const in `Button.tsx`.

11. **SHOULD use `:focus-visible` (NOT `:focus`) for the focus ring.** Focus ring on click is jarring; `:focus-visible` matches platform convention (ring on keyboard-induced focus only).
   - Reference: [MDN `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)

### Accessibility

12. **MUST require `aria-label` (or `aria-labelledby`) when no visible text label is present.** Icon-only buttons MUST be programmatically labeled. Library does not auto-infer a label from the icon name. The component **MUST emit a dev-mode `console.warn`** (guarded on `process.env.NODE_ENV !== 'production'`) when it has no text `children` and neither `aria-label` nor `aria-labelledby` is supplied — surfacing the most common a11y regression at author time without shipping the cost to production.
   - Reference: [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

13. **MUST meet WCAG 2.2 SC 2.5.8 (Target Size Minimum)** — every size variant has a hit-target of at least 24×24 CSS pixels. The `xs` size is 24×24 at the default density and **MUST carry a `min-h`/`min-w` floor of 24×24** so a `--ui-density-scale < 1` (compact density) cannot shrink the target below the WCAG floor. The floor applies to `xs` in `square` / `circle` shapes too.
   - Reference: [WCAG 2.2 SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

14. **SHOULD meet a 44×44 hit-target in touch-primary contexts.** Apple HIG and Material Design both recommend 44×44; `xs` and `sm` SHOULD NOT be the primary affordance on touch surfaces.
   - Reference: [Apple HIG — Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)

15. **MUST remain visible in `forced-colors` mode (Windows High Contrast).** Every variant MUST carry a border (1px transparent if no visible border is intended) so the OS-supplied border renders, AND MUST honor `system-color` keywords for text/background where applicable.
   - Reference: [MDN `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)

16. **MUST meet WCAG AA contrast on every `variant × tone` combination at the default theme.** Text/background contrast ≥ 4.5:1 (normal text) or ≥ 3:1 (large text + UI components); focus ring ≥ 3:1 against the surrounding background.
   - Reference: [WCAG 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [WCAG 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

### Pointer types

17. **MUST provide visible `:active` feedback for `ghost` and `link` variants.** Both variants present no visible affordance until hover, and coarse-pointer (touch) devices have no hover. `:active` fires on tap, providing the only press affordance on touch.
   - Reference: [MDN `pointer` media query](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer)

### Internationalization

18. **MUST position `leading` / `trailing` slots using logical CSS properties** (`ms-*`/`me-*`, `ps-*`/`pe-*`). Slot ORDER is logical (start → end), not visual (left → right). Tailwind v4 supports logical properties natively.
   - Reference: [MDN CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)

19. **MUST NOT bake any translatable text into the component.** No default `loadingText`, no default `closeLabel`, no announcer strings. Consumer supplies all user-facing strings, including `aria-label` for icon-only buttons. Aligns with the i18n leak inventory ([`docs/analysis/ui-philosophy/ideas.md` §7](../../../docs/analysis/ui-philosophy/ideas.md)) — Button has zero embedded text by design.

### Motion

20. **SHOULD honor `prefers-reduced-motion: reduce`.** Disable transform-based press feedback (scale, translate, rotate); preserve color/opacity transitions, since they convey state without inducing vestibular discomfort.
   - Reference: [WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), [MDN `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

21. **SHOULD scale spacing utilities with the `--ui-density-scale` CSS variable.** Height and padding utilities MUST be expressed via `calc(<base> * var(--ui-density-scale, 1))`. Default `1`. A future `<DensityProvider>` overrides the variable at any scope without component-side changes — wiring the hook now means consumers can adopt density later with no Button modification.

### Form integration

22. **The disabled-state prop MUST be the boolean `isDisabled`, forwarded to the native `disabled` attribute (not exposed as a bare `disabled` prop).** Standalone booleans across the library carry the `is*` prefix; `isDisabled` is the standalone-boolean form of the disabled state, while the rendered element keeps the native `disabled={…}` attribute. When the local `isDisabled` prop is `undefined`, the component **MUST inherit the disabled state from an enclosing `FormField`** via `useFormControl()` (reading its `isDisabled`), falling back to standalone (`false`) when there is no surrounding context. The `is*` prefix is shared with the other standalone-boolean state props (`isLoading` / `isSkeleton` / `isFullWidth` / `isMultiline`).
   - Reference: [HTML — `button.disabled`](https://html.spec.whatwg.org/multipage/form-elements.html#attr-fe-disabled)

## Standard Decision Record

**Why this shape:** Button is the most-used component in the library; its contract must survive style refreshes, theme changes, and consumer abuse. Behavior is fixed; presentation is configuration.

**Per item:**

- **Specification.1** — Native `<button>` gives role, focus, keyboard, and click semantics for free. `Slot` was chosen over `as` because `Slot`'s child-merging is structurally typed; `as`-with-generics is unsound for arbitrary element types and breaks IDE inference.
- **Specification.2** — `submit` as the HTML default is the source of countless React form bugs. Costing consumers one explicit `type="submit"` per submit button is far cheaper than the alternative.
- **Specification.3** — Restated despite being native, to prevent a future regression where someone adds a custom keydown handler that swallows Space.
- **Specification.4** — `aria-busy` keeps the element addressable to screen readers ("loading"); native `disabled` removes it from the focus order and silences SR. The two patterns produce different UX; we pick the one that doesn't hide loading state from AT users. `aria-disabled` is added on top so AT announces the button as unavailable-for-now while it stays focusable — the deliberate complement to *not* native-disabling. The `sr-only` children fallback exists because the spinner is `aria-hidden`: without it, a `loadingText`-less loading button would compute an empty accessible name and read as an unlabeled button.
- **Specification.5** — `form` attribute is cheap to forward and unlocks the modal-form pattern. Rejected: omitting it as YAGNI — actually used in haven.
- **Specification.6** — `Slot` composition over `as` because TypeScript inference fails for `<Button as={Link} to="..." />` — `to` is foreign to Button's prop type. `Slot` keeps the child's prop type intact.
- **Specification.7** — Compound API (`Button.Icon`, `Button.Label`) reserved for components with real internal structure (Card, Dialog, Menu). For Button, slots are the simpler answer.
- **Specification.8** — Spinner lives at `icons/Spinner` (foundation L1) so any component can use it without crossing the domain boundary. Button consumes it directly; consumers can override via `loadingSlot` for brand-specific indicators. Foundation-level placement avoids the older "inline SVG" workaround.
- **Specification.9** — Identical hover / focus-visible visuals are a regression that creeps in when one is added without re-checking the other. Distinct visuals = a11y (focus locator works) + UX (state legibility). `isLoading` vs `isSkeleton` distinction earns its own clause because they answer different user questions ("is my action processing?" vs "has the button's content loaded yet?") — collapsing them into one prop forces consumers to encode the difference outside the component.
- **Specification.10** — Observable state needs a non-ARIA address for analytics, integration tests, visual-regression diffing, and custom CSS overlays. `data-state` is the de facto ecosystem convention (Radix). Cannot be added later without modifying the component, hence ships in v1. `isSkeleton` joins the value set because content-loading is just as observable a state as action-loading.
- **Specification.11** — `:focus-visible` matches every modern browser's default; users who actually need always-visible focus ring set it via OS / browser preference, which `:focus-visible` honors.
- **Specification.12** — Icon-only buttons are the most common a11y regression in any UI lib. Spec makes the obligation explicit; library does not auto-infer because icon names are arbitrary and frequently incorrect labels. The dev-warn catches the omission at author time (where it's cheap to fix) and is `NODE_ENV`-guarded so it dead-code-eliminates from production bundles.
- **Specification.13** — 24×24 is the WCAG 2.2 floor; `xs` sits exactly at the limit at default density. The `--ui-density-scale` hook (Spec.21) multiplies height/padding, so a compact scale (`< 1`) would otherwise pull `xs` *below* 24×24 and silently fail SC 2.5.8 — the `min-h`/`min-w` floor clamps it. Below this, the button fails AA and must not exist as a size token.
- **Specification.14** — 44×44 is industry-recommended. Soft rule (SHOULD) because dense desktop UIs legitimately use `xs` for non-primary actions (toolbar, secondary nav).
- **Specification.15** — Forced-colors is the most-forgotten a11y mode. The transparent-border trick costs nothing and guarantees visibility in HCM.
- **Specification.16** — AA is the legal floor in many jurisdictions; AAA is aspirational. We test per-combo at the default theme; consumers who change tokens own re-testing.
- **Specification.17** — A `ghost` button on touch is functionally invisible without `:active` feedback. This is the rule that keeps "ghost works on touch" from being a known footgun.
- **Specification.18** — Logical properties give RTL for free; `ml-*` / `mr-*` would require a separate RTL stylesheet. Tailwind v4 makes this a one-character change (`ms-*` instead of `ml-*`).
- **Specification.19** — Per the i18n leak inventory, Button column is empty by design. Any default English string would be a translation tax on every consumer; consumer-supplied strings let i18n live in the consumer's translation system.
- **Specification.20** — `prefers-reduced-motion` is an a11y preference, not an aesthetic preference. Vestibular disorders are aggravated by transforms, not by color. We disable the high-risk class and keep the safe one.
- **Specification.21** — Density is a theme-wide concern; if it's not wired at the spacing-utility level on day one, retrofitting it across 169 components is a multi-week cost. Wiring the CSS-var hook now (`calc(* var(--ui-density-scale, 1))`) means a `<DensityProvider>` can land later without touching Button.
- **Specification.22** — The library convention is that every standalone boolean prop takes the `is*` prefix; the disabled state is one such standalone boolean, so the public prop is `isDisabled`. (An earlier draft mandated a bare `disabled` to mirror the HTML attribute name, but that carved Button out of the otherwise-uniform `is*` rule — `isLoading` / `isSkeleton` / `isFullWidth` / `isMultiline` already conform, and so should the disabled prop.) The *rendered* element still sets the native `disabled` attribute — only the public prop is renamed; native DOM attrs stay native. `useFormControl()` already exposes `isDisabled`, so the inheritance reads its `isDisabled` directly, and a `<FormField>` drives Button and its inputs uniformly through the shared context. Beta-forever rules make the rename a clean break (no deprecation alias).

## Related

Inline citations above point at specific rule/section URLs. This section lists umbrella references.

- Cross-cutting conventions: [`docs/common-standards.md`](../../../docs/common-standards.md) — naming (`is*` / `*Slot`), comment style, displayName, magic-value extraction.
- WCAG 2.2 — https://www.w3.org/WAI/WCAG22/quickref/
- WAI-ARIA Authoring Practices — Button pattern — https://www.w3.org/WAI/ARIA/apg/patterns/button/
- HTML Living Standard — https://html.spec.whatwg.org/multipage/form-elements.html
- MDN HTMLButtonElement — https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement
- i18n leak inventory — [`docs/analysis/ui-philosophy/ideas.md` §7](../../../docs/analysis/ui-philosophy/ideas.md)
- Sibling: `ButtonGroup.standard.md` (TBD), `CopyButton.standard.md` (TBD), `ToggleButton.standard.md` (TBD). For icon-only buttons, use `<Button shape="square">` (or `<Button shape="circle">` for circular).
