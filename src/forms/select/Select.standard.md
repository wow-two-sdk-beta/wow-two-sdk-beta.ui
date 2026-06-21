# Select Standard

## Subject Philosophy

A Select lets a user pick exactly one value from a known, enumerable set by opening a floating list of options anchored to a button trigger. It is the dropdown-list answer to "which one?" when the option space is small-to-medium (roughly ≤ 50 entries) and every choice can be shown verbatim. The trigger collapses the current choice to a single labelled button; the popup is a `role="listbox"` of `role="option"` rows. Use a Select when options are predefined and a free-text query is unnecessary — reach for `Combobox` instead when the user should be able to type-filter against a large or remote set, or supply their own value, and reach for a future `MultiSelect` when more than one value may be chosen at once. **Trigger reflects, list decides** — the button only ever mirrors the committed selection; mutation happens exclusively inside the list. **Key is identity, value is payload** — the generic `<K, V>` split keys equality/serialization on `K` while returning a rich `V` to the consumer. **Composition over configuration** — Trigger, Value, Content, and Item are real sub-components so consumers control markup, not a prop avalanche. Searchable mode is an in-list convenience filter, not a Combobox; it never accepts free-text values.

## Scope

**Applies to:** the `Select` component in `src/forms/select/`.

## Standard Specification

Items use RFC 2119 keywords (MUST · SHOULD · MAY). Each item is independently verifiable. Numbering runs continuously across groups. Inline citations point at the specific rule URL; broad references live in `Related`.

### Behavior

1. **MUST open the listbox on trigger activation (click, Enter, or Space) and toggle it closed on a second activation.** The trigger is a native `<button>`, so Enter/Space activation is inherited rather than re-implemented.
   - Reference: [WAI-ARIA APG — Select-Only Combobox / Listbox keyboard](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/)

2. **MUST close the listbox on outside pointer-down and on Escape, and MUST return focus to the trigger on close.** Close-and-restore is owned by the popover's dismissable layer; the component MUST NOT trap focus away from the trigger after closing.

3. **MUST move the active option with ArrowUp/ArrowDown and jump with Home/End/PageUp/PageDown, select the active option with Enter, and skip `disabled` options during navigation.** In the non-searchable case the listbox itself holds keyboard focus and owns this handling; in the searchable case see item 7.

4. **MUST initialise the active option to the currently-selected option when the list opens, falling back to the first enabled option when nothing is selected.** A list that opens with no active option strands keyboard users on the first arrow press.

5. **MUST commit a selection by emitting `onValueChange(option | null)` and MUST NOT mutate any value the consumer controls via `value`.** `null` is emitted only on clear. A controlled `value` that the consumer ignores MUST leave the rendered selection unchanged.

6. **MUST support type-to-select (typeahead) outside searchable mode, via the shared `useTypeahead` hook.** On the **closed** focused trigger, typing a printable character MUST select the matching option without opening the popover (matching native `<select>`); when **open and non-searchable** the focused listbox's typeahead MUST move the active option. The matcher MUST prefix-match the accumulated buffer case-insensitively, MUST cycle through matches when a single character is repeated (starting after the active/selected option), MUST skip `disabled` options, and MUST reset the buffer after a short idle timeout (~500ms). In **searchable** mode typeahead MUST be suppressed — the filter input owns printable input there.
   - Reference: [WAI-ARIA APG — Listbox keyboard interaction (type-ahead)](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboardinteraction)

### Composition

7. **In searchable mode the search input MUST bridge keyboard navigation to the listbox.** ArrowUp/Down/Home/End/PageUp/PageDown/Enter typed in the input MUST drive the listbox's active option and selection (the input forwards these to the listbox handler and mirrors the resulting `aria-activedescendant`); printable characters MUST be reserved for the filter; Escape MUST close the popover and restore focus to the trigger. A searchable Select MUST NOT be reachable by pointer only.
   - Reference: [WAI-ARIA APG — Editable Combobox with List Autocomplete](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/)

8. **MUST expose a compound API (`Select.Trigger`, `Select.Value`, `Select.Content`, `Select.Item`, `Select.Group`, `Select.Separator`, `Select.Empty`) with all selection state held on the root via context.** Item rendering MUST reuse the same-domain `Listbox.Item` so a Select option is visually and behaviourally identical to a standalone `Listbox` option.

9. **The clear control MUST be a real sibling `<button>`, never an interactive element nested inside the trigger button.** Nesting an interactive control inside a `<button>` is invalid HTML, unreachable by keyboard, and ambiguous to assistive tech.
   - Reference: [HTML — `<button>` content model](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element)

### States

10. **MUST distinguish `default`, `hover`, `focus-visible`, `open`, `invalid`, `loading`, and `disabled` with visually distinct presentations** at the default theme; `hover` and `focus-visible` MUST NOT be identical. The trigger's height, border, focus ring, disabled, and per-size paddings MUST derive from the shared `inputBaseVariants` so they stay in lockstep with `TextInput`.

11. **MUST emit a `data-state` attribute on the trigger reflecting its observable state.** Resolution order: `open` → `loading` → `disabled` → `invalid`, absent when none apply. Lets tests, visual-regression suites, and custom CSS target state without prop drilling.

12. **MUST set `aria-busy="true"` and block interaction while `isLoading`, and MUST NOT remove the trigger from the focus order to express loading.** Native `disabled` silences screen-reader state; `aria-busy` keeps the control addressable.
   - Reference: [WAI-ARIA `aria-busy`](https://www.w3.org/TR/wai-aria-1.2/#aria-busy)

### Accessibility

13. **The trigger MUST advertise `aria-haspopup="listbox"`, `aria-expanded`, and `aria-controls` pointing at the listbox id, and MUST reflect the active option via `aria-activedescendant` while open.** It MUST NOT inherit the popover's default `aria-haspopup="dialog"` — a single-select list is a listbox, not a dialog.
   - Reference: [WAI-ARIA APG — Combobox `aria-haspopup`/`aria-controls`](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

14. **The trigger MUST have an accessible name.** When wrapped by `FormField` it MUST be named by the field label via `aria-labelledby`; otherwise it MUST accept an `aria-label`. An explicit `aria-label` MUST win over the inherited label.
   - Reference: [WCAG 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

15. **When rendered inside a `FormField` (or any `FormControlProvider`) the Select MUST inherit `id`, `disabled`, `invalid`, and `aria-describedby` (helper + error ids) from context, with standalone props taking precedence when supplied.** A context `invalid` MUST surface as the trigger's `state='invalid'` and `aria-invalid`.

16. **The clear (×) control MUST meet WCAG 2.2 SC 2.5.8 — a hit target of at least 24×24 CSS pixels — while the glyph itself MAY render smaller.** The target is floored via `min-h-6 min-w-6`; the visible icon stays sized to the trigger.
   - Reference: [WCAG 2.2 SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

17. **The closed trigger MUST display the human-readable label of the selected option, not a serialized key.** Options register only while the popup is open, so for a controlled/default value shown before first open the component MUST resolve the label via (in order) the live registry, the label captured at selection time, a consumer-supplied `getOptionLabel`, and only as a last resort the serialized key.

### Form integration

18. **When `name` is set the Select MUST render a hidden `<input name>` carrying the serialized key, rendered outside the popover content so it survives form submission while the popup is closed.** Serialization MUST honour a consumer `serializeKey`, defaulting to `String(key)`.
   - Reference: [HTML — form submission / successful controls](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-form-data-set)

### Internationalization

19. **MUST NOT bake translatable UI text into the component.** The clear-button label (`clearLabel`), search placeholder (`searchPlaceholder`), and no-results text (`noResultsLabel`) MUST be consumer-supplied props; defaults exist only as English fallbacks.

### Motion

20. **SHOULD honour `prefers-reduced-motion: reduce`.** Open/close and chevron-rotation transitions SHOULD be reduced to opacity-only (or removed) when the user requests reduced motion; the open/close itself MUST remain instantaneous and complete.
   - Reference: [WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

## Standard Decision Record

**Why this shape:** Select is the single-choice workhorse. Its contract pins the listbox semantics and form/a11y wiring; visual presentation is configuration that piggybacks on the shared input styles so it can never drift from `TextInput`.

**Per item:**

- **Specification.1–2** — Native `<button>` + popover dismissable layer give activation, outside-click, Escape, and focus-restore for free; re-implementing them invites regressions.
- **Specification.3–4** — Keyboard list navigation and a sane initial active option are the difference between an accessible listbox and a mouse-only widget. Initialising to the selected option matches platform `<select>` behaviour.
- **Specification.5** — Controlled-component discipline: the component never writes a value the consumer owns. `null`-on-clear keeps "no selection" expressible without sentinel keys.
- **Specification.6** — Type-to-select is table-stakes for a `<select>` replacement; without it keyboard users must arrow through long lists. A shared `useTypeahead` hook keeps the closed-trigger and open-listbox cases (and future MultiSelect/Menu) on one matcher; the closed-trigger path mirrors native `<select>` (select without opening) while the open path reuses the listbox's active-option model. Suppressing it in searchable mode avoids fighting the filter input over printable keys.
- **Specification.7** — The original searchable mode put focus on the search input with no keyboard bridge, making it click-only — a hard a11y failure. Rather than fork the listbox, the input re-dispatches navigation keys to the listbox's own handler and mirrors its `aria-activedescendant`, reusing one source of truth.
- **Specification.8** — Compound API matches the real internal structure (trigger + list + options) and lets consumers own markup. Reusing `Listbox.Item` guarantees option parity with the standalone listbox at zero maintenance cost.
- **Specification.9** — A clear button nested inside the trigger `<button>` is invalid content model and keyboard-unreachable; a sibling button overlaying a reserved slot is the only correct shape.
- **Specification.10** — Deriving trigger variants from `inputBaseVariants` (via `tv` `extend`) is what keeps the trigger's height/border/ring/size identical to `TextInput`; the prior hand-copied variants had already drifted at `xs`.
- **Specification.11–12** — `data-state` gives a non-ARIA address for tests/CSS; `aria-busy` over `disabled` keeps loading announced. Both mirror Button's discipline.
- **Specification.13** — The trigger reuses the popover trigger, which defaults to `aria-haspopup="dialog"`; overriding to `listbox` + wiring `aria-controls`/`aria-activedescendant` is mandatory or screen readers mis-announce the widget.
- **Specification.14–15** — Inheriting from `FormControlProvider` is what makes `<FormField error=…><Select/></FormField>` actually wire label/description/invalid; standalone-props-win keeps the atom usable without a field.
- **Specification.16** — The clear glyph was 16×16 at `xs`, under the 24px WCAG floor; flooring the target while keeping the glyph small fixes the violation without bloating the visual.
- **Specification.17** — Because items register lazily on open, a controlled value would show its raw key before first open. `getOptionLabel` is the lightest correct fix — no eager registration, no forced children.
- **Specification.18** — Hidden input outside the popover is the only way the value survives submission while the popup is closed (inside `PopoverContent` it unmounts).
- **Specification.19** — Every default English string is a translation tax; making them props with fallbacks lets i18n live in the consumer.
- **Specification.20** — Reduced-motion is an a11y preference; the open must still complete, only the animation is trimmed.

## Related

Inline citations above point at specific rule/section URLs. This section lists umbrella references.

- Cross-cutting conventions: [`docs/common-standards.md`](../../../docs/common-standards.md) — naming, comment style, displayName, magic-value extraction.
- WCAG 2.2 — https://www.w3.org/WAI/WCAG22/quickref/
- WAI-ARIA Authoring Practices — Listbox pattern — https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
- WAI-ARIA Authoring Practices — Combobox pattern — https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- HTML Living Standard — https://html.spec.whatwg.org/multipage/form-elements.html
- MDN Web APIs — https://developer.mozilla.org/en-US/docs/Web/API
- Siblings: `Listbox` (`src/forms/listbox/`), `Combobox` (`src/forms/combobox/`), `FormField` (`src/forms/formField/`). Standards TBD.
