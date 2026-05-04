# {Component} Standard

## Subject Philosophy

{What this component IS and what it's FOR. ≤200 words. Definition + purpose +
when-to-use vs alternatives. Named principles inline as `**name**` — gloss.
No RFC 2119 keywords. No bullets, sub-headings, or code blocks. Continuous prose.}

## Scope

**Applies to:** the `{Component}` component in `src/{domain}/{component}/`.

## Standard Specification

Items use RFC 2119 keywords (MUST · SHOULD · MAY). Each item is independently
verifiable — a reviewer can point at the implementation and say conforms /
does not conform. Numbering runs continuously across groups. Examples and
inline citations live inside the item they illustrate; broad references live
in the `Related` section.

Use the pre-defined groups below where applicable; add component-specific
groups when warranted (e.g. **Pointer types**, **Form integration**).

### Behavior

1. **MUST {…}.**
   - *Example — good:* `…`
   - Reference: [{specific rule URL}]({url})

2. **SHOULD {…}.**

### Composition

3. **MUST {…}.**

### States

4. **MUST {…}.**

### Accessibility

5. **MUST {…}.**

### Internationalization

6. **SHOULD {…}.**

### Motion

7. **SHOULD {…}.**

## Standard Decision Record

**Why this shape:** {1–2 sentences on overall philosophy.}

**Per item:**
- **Specification.1** — {why this rule earned its place; what was rejected and why}.
- **Specification.2** — {…}.

## Related

Inline citations point at the SPECIFIC rule/section URL. This section lists
BROAD references — whole specs, gallery pages, MDN API roots, sibling component
standards. One entry per umbrella, not per rule.

- WCAG 2.2 — https://www.w3.org/WAI/WCAG22/quickref/
- WAI-ARIA Authoring Practices — https://www.w3.org/WAI/ARIA/apg/patterns/
- HTML Living Standard — https://html.spec.whatwg.org/
- MDN Web APIs — https://developer.mozilla.org/en-US/docs/Web/API
- Sibling: {SiblingComponent.standard.md}
