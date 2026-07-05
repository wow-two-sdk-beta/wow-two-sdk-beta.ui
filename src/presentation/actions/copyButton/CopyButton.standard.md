# CopyButton Standard

## Subject Philosophy

A CopyButton makes a string available on the user's clipboard with one click and visibly confirms the copy succeeded. It exists because **invisible actions are broken actions** — without a visible swap (icon, label, or both) the user can't tell whether the click was registered, and clipboard failures (permission denied, insecure context, missing API) become silent dead-ends. CopyButton is built on `Button` (preserving every action-button affordance — keyboard, focus, variants, density, polymorphism) and on the `useClipboard` hook (which manages the transient `copied` flag plus the last `error`). The contract: the user sees confirmation within the same render cycle, the state auto-resets after a configurable window so consecutive copies feel responsive, and clipboard rejections surface via `onError` rather than being swallowed. **State as primary signal, content as secondary** — `data-copied` is the canonical observable state for analytics / CSS / integration tests; the icon swap is the user-facing manifestation of the same fact.

## Scope

**Applies to:** the `CopyButton` component in `src/actions/copyButton/`.

## Standard Specification

Items use RFC 2119 keywords (MUST · SHOULD · MAY). Each item is independently verifiable. Numbering runs continuously across groups.

### Behavior

1. **MUST inherit every behavioral guarantee from `Button.standard.md`** — native `<button>` semantics, default `type="button"`, Enter/Space activation, `asChild` polymorphism, press / debounce hooks. CopyButton wraps Button without overriding any of its locked rules.
   - Reference: [`Button.standard.md`](../button/Button.standard.md)

2. **MUST attempt `navigator.clipboard.writeText(text)` on click** and reflect the outcome in `copied` / `error` state (sourced from `useClipboard`).
   - Reference: [MDN — Clipboard API `writeText`](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)

3. **MUST set `copied=true` on a successful write AND auto-reset `copied` back to `false` after `resetAfter` ms (default 2000).** When `resetAfter=0`, `copied` MUST stay `true` until the component unmounts or the consumer remounts it with a fresh key.

4. **MUST call `onError(error)` exactly once per error transition** when `onError` is provided. The error is the `Error` instance produced by `useClipboard` (wraps non-Error throws). Repeated identical errors trigger one `onError` call per transition (state goes null → Error), not per render.

### Composition

5. **MUST be implemented as a slim wrapper around `Button`** — no parallel variant table, no parallel size table, no parallel `aria-busy` logic. Every styling / interaction prop forwards to Button via `{...rest}`. CopyButton owns `text`, `resetAfter`, `copiedAriaLabel`, `onError` and the `copied`-aware label / content swap; Button owns everything else.

6. **MUST default `variant` to `'ghost'`.** Copy buttons sit alongside content (code blocks, ID rows, share fields) and act as secondary affordances; `'ghost'` is the lowest visual weight and matches industry convention (Vercel, GitHub, Linear all default copy buttons to ghost).

7. **MUST support a render-prop `children`** signature — `((args: { copied: boolean; error: Error | null }) => ReactNode)` — for state-driven content swaps. Static `ReactNode` children are also supported. When `children` is omitted, the default content is `<Icon icon={copied ? Check : Copy} size={16} />`.

### States

8. **MUST emit `data-copied="true"`** on the rendered element while `copied=true`; the attribute MUST be absent (not `data-copied="false"`) otherwise. The attribute lets analytics scrapers, integration tests, and custom CSS overlays target the success state without prop drilling.

9. **MUST NOT emit `data-state="copied"`.** Button reserves `data-state` for its own lifecycle states (`loading | skeleton | disabled`) per [Button standard rule 10](../button/Button.standard.md#states). CopyButton's success state lives in a separate `data-*` namespace to avoid collision when both states are simultaneously active (e.g. a loading + copied button mid-reset).

10. **`copied` and `error` MUST be mutually exclusive at any moment in time.** A successful copy clears any prior `error`; a failed copy clears `copied=false`. The render-prop receives both for symmetry, but at most one is non-falsy.

### Accessibility

11. **MUST require `aria-label` at the type level.** Icon-only is the default content, and an unlabeled icon button is the most common a11y regression in any UI library. The library REFUSES to compile a missing label rather than auto-inferring one from the icon name.
    - Reference: [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

12. **MUST swap `aria-label` to `copiedAriaLabel` while `copied=true`** when `copiedAriaLabel` is provided. When omitted, `aria-label` remains stable across the state transition. Screen-reader announcement of the transition is the consumer's choice — making the swap automatic with a hardcoded English string would violate the i18n leak rule (Button standard rule 19).
    - Reference: [`Button.standard.md` rule 19 — i18n discipline](../button/Button.standard.md#internationalization)

13. **MUST NOT bake any translatable text into the component.** No default `'Copy'` / `'Copied'` aria-label fallback, no announcer string. Consumer supplies `aria-label` (required) and `copiedAriaLabel` (optional). Aligns with Button standard rule 19.

### Error handling

14. **MUST NOT throw from the click handler when `navigator.clipboard.writeText` rejects.** The hook captures the error, sets the `error` state, and the `onError` callback is invoked on the resulting state transition. Throwing would break uncontrolled call sites (e.g. a Toolbar that doesn't wrap each child in a try/catch).

15. **MAY remain silent on error when `onError` is not provided.** Default behavior is "best-effort copy" — appropriate for non-critical affordances where the consumer hasn't opted into error handling.

### Motion & a11y inheritance

16. **MUST honor `prefers-reduced-motion: reduce`** by virtue of being a Button — transform-based press feedback is disabled, color/opacity transitions retained. CopyButton adds no motion of its own.
    - Reference: [`Button.standard.md` rule 20](../button/Button.standard.md#motion)

## Standard Decision Record

**Why this shape:** CopyButton is the canonical example of a slim wrapper that adds REAL new behavior (clipboard logic + transient state + error path) on top of Button. The wrapper earns its place — a `<Button onClick={() => navigator.clipboard.writeText(text)}>` is incomplete because it has no success feedback, no reset, no error path. CopyButton encapsulates that recipe so every consumer doesn't reinvent it.

**Per item:**

- **Specification.1** — Behavioral parity with Button is non-negotiable; any new state machine in CopyButton would diverge from the rest of the action family. Button is the substrate.
- **Specification.2** — `navigator.clipboard.writeText` is the modern clipboard primitive. `document.execCommand('copy')` is deprecated and unreliable in iframes; we don't fall back. Insecure-context failures surface via `onError`.
- **Specification.3** — 2000ms is the industry default — Vercel's clipboard, GitHub's "copy commit hash", Linear's "copy issue ID" all use ≈2s. Long enough to read, short enough to allow rapid consecutive copies. `resetAfter=0` gives consumers full control for sticky states.
- **Specification.4** — Once-per-transition is the consumer-friendly contract. Per-render firing is a footgun for unmemoized handlers; ref-based effect bypasses it.
- **Specification.5** — A parallel variant/size table would force two-place maintenance for every Button styling change. Slim wrapping is the only sustainable shape; it's also why this component survives standardization where IconButton and OverlayButton didn't.
- **Specification.6** — Ghost is what every major library defaults its copy button to. Surface / outline read as primary CTAs, which is wrong for an inline affordance.
- **Specification.7** — Render-prop is the lightest API for "swap on state without lifting state up." `<CopyButton>{({copied}) => copied ? 'Copied!' : 'Copy'}</CopyButton>` reads naturally and stays in-line.
- **Specification.8** — `data-copied` is a CopyButton-specific observable; CSS / analytics / tests target it without parsing class names. Boolean-attribute pattern (present-or-absent) matches HTML's native shape (`<input disabled>` is the same idiom).
- **Specification.9** — Co-existence with Button's `data-state` is the constraint. Reserving `data-state` for Button's lifecycle and using `data-copied` for CopyButton's success state lets both states render orthogonally on the same element.
- **Specification.10** — Mutual exclusion follows from the state machine: success clears error, failure clears success. Render-prop exposes both for symmetry but the consumer never sees both truthy.
- **Specification.11** — TS-required aria-label is the only effective guardrail for icon-only buttons. Documentation rules are routinely ignored; the type system is not.
- **Specification.12** — Auto-swap with a hardcoded "Copied" string would force English on every consumer. The opt-in `copiedAriaLabel` keeps i18n in the consumer's translation system.
- **Specification.13** — Same reasoning as Button rule 19. Discipline scales with reach: defaults that look harmless multiply across hundreds of consumers.
- **Specification.14** — Throwing from a click handler is a footgun for any consumer that doesn't expect it. Error propagation via state + callback is the React-idiomatic shape.
- **Specification.15** — Best-effort default keeps the component usable in low-stakes contexts (a "copy snippet" button in a docs page) without forcing an error UI on every call site. Consumers who care wire up `onError`.
- **Specification.16** — Inherited from Button; restated to make the inheritance contract explicit (a future regression in Button shouldn't break CopyButton's reduced-motion guarantee).

## Related

Inline citations point at specific rule URLs. Broad references:

- Cross-cutting conventions: [`docs/common-standards.md`](../../../docs/common-standards.md) — naming, comment style, displayName, magic-value extraction, "Renders" verb (Common.10/11).
- Substrate: [`Button.standard.md`](../button/Button.standard.md) — every behavior CopyButton inherits.
- Hook: [`useClipboard.ts`](../../hooks/useClipboard.ts) — clipboard state machine.
- WCAG 2.2 — https://www.w3.org/WAI/WCAG22/quickref/
- MDN Clipboard API — https://developer.mozilla.org/en-US/docs/Web/API/Clipboard
- Sibling: `ToggleButton.standard.md` (TBD), `DisclosureButton.standard.md` (TBD)
