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

4. **MUST set `aria-busy="true"` and block `onClick` when `loading=true`, AND MUST NOT set the native `disabled` attribute as a side effect of `loading`.** Native `disabled` removes the element from focus order and suppresses screen-reader state announcements.
   - Reference: [WAI-ARIA `aria-busy`](https://www.w3.org/TR/wai-aria-1.2/#aria-busy)

5. **MUST forward the `form` attribute** to support submit-from-outside-form patterns (e.g. modal forms with footer actions in a separate DOM subtree).
   - Reference: [HTML — `button.form`](https://html.spec.whatwg.org/multipage/form-elements.html#attr-fae-form)

### Composition

6. **MUST polymorphism via `asChild` (Slot pattern); MUST NOT expose a generic `as` prop.** `Slot` is structurally typed via children; `as` requires generics that break inference for arbitrary element types.

7. **MUST expose `leading` and `trailing` slot props for icon composition; MUST NOT expose a compound API (`Button.Icon`, `Button.Label`).** Button has no nameable internal structure beyond decorations — slot props match the actual mental model with less ceremony.

8. **MAY import sibling-domain components but SHOULD NOT.** Atom-rule convention: Button stays self-contained. The `loading` spinner is inlined as SVG rather than imported from `feedback/spinner`.

### States

9. **MUST distinguish `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading` with visually distinct presentations** at the default theme. `hover` and `focus-visible` MUST NOT be visually identical.

10. **MUST emit a `data-state` attribute reflecting current observable state.** Values: `loading` (when `loading=true`), `disabled` (when `disabled=true` and not loading), absent otherwise. Lets analytics scrapers, integration tests, visual-regression suites, and custom CSS overlays target state without prop drilling. Convention borrowed from Radix UI.

11. **SHOULD use `:focus-visible` (NOT `:focus`) for the focus ring.** Focus ring on click is jarring; `:focus-visible` matches platform convention (ring on keyboard-induced focus only).
   - Reference: [MDN `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)

### Accessibility

12. **MUST require `aria-label` (or `aria-labelledby`) when no visible text label is present.** Icon-only buttons MUST be programmatically labeled. Library does not auto-infer a label from the icon name.
   - Reference: [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

13. **MUST meet WCAG 2.2 SC 2.5.8 (Target Size Minimum)** — every size variant has a hit-target of at least 24×24 CSS pixels. The `xs` size is exactly 24×24.
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

## Standard Decision Record

**Why this shape:** Button is the most-used component in the library; its contract must survive style refreshes, theme changes, and consumer abuse. Behavior is fixed; presentation is configuration.

**Per item:**

- **Specification.1** — Native `<button>` gives role, focus, keyboard, and click semantics for free. `Slot` was chosen over `as` because `Slot`'s child-merging is structurally typed; `as`-with-generics is unsound for arbitrary element types and breaks IDE inference.
- **Specification.2** — `submit` as the HTML default is the source of countless React form bugs. Costing consumers one explicit `type="submit"` per submit button is far cheaper than the alternative.
- **Specification.3** — Restated despite being native, to prevent a future regression where someone adds a custom keydown handler that swallows Space.
- **Specification.4** — `aria-busy` keeps the element addressable to screen readers ("loading"); `disabled` removes it from the focus order and silences SR. The two patterns produce different UX; we pick the one that doesn't hide loading state from AT users.
- **Specification.5** — `form` attribute is cheap to forward and unlocks the modal-form pattern. Rejected: omitting it as YAGNI — actually used in haven.
- **Specification.6** — `Slot` composition over `as` because TypeScript inference fails for `<Button as={Link} to="..." />` — `to` is foreign to Button's prop type. `Slot` keeps the child's prop type intact.
- **Specification.7** — Compound API (`Button.Icon`, `Button.Label`) reserved for components with real internal structure (Card, Dialog, Menu). For Button, slots are the simpler answer.
- **Specification.8** — The atom rule's intent was bundle isolation. Tailwind makes this less critical (no per-component CSS to drag in), but the cleanliness benefit holds. Inlined SVG for spinner trades 15 lines of code for full atom-purity.
- **Specification.9** — Identical hover / focus-visible visuals are a regression that creeps in when one is added without re-checking the other. Distinct visuals = a11y (focus locator works) + UX (state legibility).
- **Specification.10** — Observable state needs a non-ARIA address for analytics, integration tests, visual-regression diffing, and custom CSS overlays. `data-state` is the de facto ecosystem convention (Radix). Cannot be added later without modifying the component, hence ships in v1.
- **Specification.11** — `:focus-visible` matches every modern browser's default; users who actually need always-visible focus ring set it via OS / browser preference, which `:focus-visible` honors.
- **Specification.12** — Icon-only buttons are the most common a11y regression in any UI lib. Spec makes the obligation explicit; library does not auto-infer because icon names are arbitrary and frequently incorrect labels.
- **Specification.13** — 24×24 is the WCAG 2.2 floor; `xs` is exactly at the limit. Below this, the button fails AA and must not exist as a size token.
- **Specification.14** — 44×44 is industry-recommended. Soft rule (SHOULD) because dense desktop UIs legitimately use `xs` for non-primary actions (toolbar, secondary nav).
- **Specification.15** — Forced-colors is the most-forgotten a11y mode. The transparent-border trick costs nothing and guarantees visibility in HCM.
- **Specification.16** — AA is the legal floor in many jurisdictions; AAA is aspirational. We test per-combo at the default theme; consumers who change tokens own re-testing.
- **Specification.17** — A `ghost` button on touch is functionally invisible without `:active` feedback. This is the rule that keeps "ghost works on touch" from being a known footgun.
- **Specification.18** — Logical properties give RTL for free; `ml-*` / `mr-*` would require a separate RTL stylesheet. Tailwind v4 makes this a one-character change (`ms-*` instead of `ml-*`).
- **Specification.19** — Per the i18n leak inventory, Button column is empty by design. Any default English string would be a translation tax on every consumer; consumer-supplied strings let i18n live in the consumer's translation system.
- **Specification.20** — `prefers-reduced-motion` is an a11y preference, not an aesthetic preference. Vestibular disorders are aggravated by transforms, not by color. We disable the high-risk class and keep the safe one.
- **Specification.21** — Density is a theme-wide concern; if it's not wired at the spacing-utility level on day one, retrofitting it across 169 components is a multi-week cost. Wiring the CSS-var hook now (`calc(* var(--ui-density-scale, 1))`) means a `<DensityProvider>` can land later without touching Button.

## Related

Inline citations above point at specific rule/section URLs. This section lists umbrella references.

- WCAG 2.2 — https://www.w3.org/WAI/WCAG22/quickref/
- WAI-ARIA Authoring Practices — Button pattern — https://www.w3.org/WAI/ARIA/apg/patterns/button/
- HTML Living Standard — https://html.spec.whatwg.org/multipage/form-elements.html
- MDN HTMLButtonElement — https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement
- i18n leak inventory — [`docs/analysis/ui-philosophy/ideas.md` §7](../../../docs/analysis/ui-philosophy/ideas.md)
- Sibling: `ButtonGroup.standard.md` (TBD), `IconButton.standard.md` (TBD), `CopyButton.standard.md` (TBD), `ToggleButton.standard.md` (TBD)
