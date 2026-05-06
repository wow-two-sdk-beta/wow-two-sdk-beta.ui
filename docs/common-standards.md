# Common Standards — `@wow-two-beta/ui`

Project-wide conventions that aren't component-specific. Each rule uses RFC 2119
keywords (MUST · SHOULD · MAY) and is independently verifiable. Stays local
until `wow-two-standards` is ready to absorb cross-library standards.

Numbering runs continuously across groups so rules stay citable as
`Common.N` from any spec, standard, or PR.

## Code comments

1. **The top-of-file comment on a component or implementation file MUST be a
   single line** describing what the unit *is*, OR omitted entirely when the
   filename + folder context speaks for itself. Anything longer belongs in
   the matching `*.standard.md` / `*.spec.md`.
   - *Example — good:* `/* Inlined SVG spinner — currentColor + 1em sizing. */`
   - *Example — bad:* a multi-line block listing variants, behaviors, consumers, or usage tips.

2. **Component comments MUST NOT name downstream consumers.** Don't write
   "used by Button, CopyButton, …". Consumers find this unit via imports —
   that's the source of truth. Naming consumers in the comment forces two
   places to update whenever a new consumer arrives, and the comment goes
   stale silently.
   - *Example — bad:* `/* Inlined SVG spinner. Used by Button (loading state), CopyButton. */`
   - *Example — good:* `/* Inlined SVG spinner — currentColor + 1em sizing. */`

3. **Component comments MAY name immediate upstream dependencies** when that
   structural fact aids comprehension — e.g. *"Wraps `Button` with X."*
   Downstream relationships are out; "this is a wrapper around X" is in.
   - *Example — good:* `/* Slim wrapper around Button — variant=glass + shape=circle preset. */`

4. **Inline / mid-function comments MAY be multi-line** and MAY include any
   detail that aids the reader. The single-line rule only governs the
   top-of-file comment.

5. **Prop / interface-member comments MUST be single-line `/* ... */` block
   comments** (NOT JSDoc `/** ... */`), with one blank line between props
   for visual grouping. JSDoc tooling (IDE hover, Storybook autodocs) is
   intentionally NOT used — keep prop names + types self-documenting and
   defer detailed prose to the spec/standard files.
   - *Example — good:*
     ```ts
     /* Slot before children. */
     leadingSlot?: ReactNode;

     /* Action-loading: replaces leading w/ spinner. */
     isLoading?: boolean;
     ```
   - *Example — bad:* multi-line `/** ... */` JSDoc, or missing blank line between props.

## Naming conventions

6. **Boolean props MUST use the `is*` prefix** (`isLoading`, `isSkeleton`,
   `isDisabled`, `isFullWidth`, `isMultiline`). Applies even when shadowing a
   native HTML attribute (`disabled` → `isDisabled`) — internal consistency
   wins over HTML mirroring; the native attribute is forwarded internally.
   - *Exception:* action props that aren't pure state (`asChild`) keep their
     verb-y / mode-y form.

7. **Slot props (props receiving `ReactNode`) MUST use the `*Slot` suffix**
   (`leadingSlot`, `trailingSlot`, `loadingSlot`). Distinguishes slots from
   boolean toggles at a glance.

8. **`displayName` MUST be set on every `forwardRef` / `memo` / arrow-function
   component to its component name.** Required for React DevTools / Profiler
   readability. Define a top-level `COMPONENT_NAME` const so the literal
   isn't repeated across `displayName` + console warnings + other identity
   strings.
   - *Example — good:*
     ```ts
     const COMPONENT_NAME = 'Button';
     export const Button = forwardRef<HTMLButtonElement, ButtonProps>(...);
     Button.displayName = COMPONENT_NAME;
     ```

## Magic-value extraction

9. **String/number literals that appear in the type signature AND have at
   least one default-value or comparison usage MUST be hoisted to a `const`
   (or `as const` object) with a matching type alias.** Use the `*Extensions.ts`
   namespace pattern when the consts are reusable across components; keep
   local in the component file when they're component-specific.
   - *Example — good:* `ButtonType` (`{Button, Submit, Reset}`) lives in
     `utils/HtmlExtensions.ts` because button-element components share it.
   - *Example — good:* `ButtonDataState` (`{Loading, Skeleton, Disabled}`)
     lives in `Button.tsx` because the values are Button-specific.

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
- **Common.5** — JSDoc `/** ... */` would give IDE-hover and Storybook
  autodocs benefits, but the project explicitly trades those for visual
  consistency with regular `/* */` and forces prose into spec/standard files
  (one source of truth for descriptions). Prop names + types carry the
  semantic load.
- **Common.6** — `is*` prefix is the React Aria / Chakra v2 convention. The
  cost is one extra `is` per boolean; the benefit is unambiguous "this is a
  state boolean" vs "this is a method/handler". Worth the minor inconsistency
  with HTML attribute names.
- **Common.7** — `*Slot` suffix differentiates `ReactNode`-receiving props
  from boolean toggles. `<Button leading>` would parse OK but read as a
  boolean; `<Button leadingSlot={...}>` self-documents.
- **Common.8** — `forwardRef` / `memo` lose the inferred displayName, leaving
  React DevTools showing "ForwardRef" everywhere. The `COMPONENT_NAME` const
  also de-magic's strings used in console warnings (`[Button] foo` →
  `` [`${COMPONENT_NAME}`] foo ``).
- **Common.9** — magic strings/numbers that appear in BOTH the type and a
  default/comparison are the high-leverage extractions. Extracting one-off
  literals is over-engineering; extracting recurring ones eliminates "edit
  in N places" failure modes.
