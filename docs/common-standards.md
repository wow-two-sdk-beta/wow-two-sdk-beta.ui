# Common Standards — `@wow-two-beta/ui`

Project-wide conventions that aren't component-specific. Each rule uses RFC 2119
keywords (MUST · SHOULD · MAY) and is independently verifiable. Stays local
until `wow-two-standards` is ready to absorb cross-library standards.

Numbering runs continuously across groups so rules stay citable as
`Common.N` from any spec, standard, or PR.

## Code comments

1. **The top-of-file JSDoc on a component or implementation file MUST be a
   single line** describing what the unit *is*. Anything longer belongs in
   the matching `*.standard.md` / `*.spec.md` — link to those files from the
   single line if helpful.
   - *Example — good:* `/** Foundational interactive element — see Button.standard.md + Button.spec.md. */`
   - *Example — bad:* a multi-line block listing variants, behaviors, consumers, or usage tips.

2. **Component comments MUST NOT name downstream consumers.** Don't write
   "used by Button, CopyButton, …". Consumers find this unit via imports —
   that's the source of truth. Naming consumers in the comment forces two
   places to update whenever a new consumer arrives, and the comment goes
   stale silently.
   - *Example — bad:* `/** Inlined SVG spinner. Used by Button (loading state), CopyButton. */`
   - *Example — good:* `/** Inlined SVG spinner — currentColor + 1em sizing. */`

3. **Component comments MAY name immediate upstream dependencies** when that
   structural fact aids comprehension — e.g. *"Wraps `Button` with X."*
   Downstream relationships are out; "this is a wrapper around X" is in.
   - *Example — good:* `/** Slim wrapper around Button — variant=glass + shape=circle preset. */`

4. **Inline / mid-function comments MAY be multi-line** and MAY include any
   detail that aids the reader. The single-line rule only governs the
   top-of-file JSDoc.

## Decision Record

- **Common.1** — implementation files drift faster than docs; long file-level
  prose is the first thing to rot. The one-liner rule forces the reader to
  the canonical spec/standard for anything substantial.
- **Common.2** — naming consumers creates a circular dependency: the comment
  becomes stale every time someone imports the unit somewhere new. Imports
  are the source of truth.
- **Common.3** — naming what a unit is built ON helps a reader understand the
  shape immediately. Naming what is built ON the unit doesn't.
- **Common.4** — the rule targets file-level prose (the surface that's most
  likely to drift). Inline comments are about specific code blocks and
  evolve with them; restricting them adds noise without value.
