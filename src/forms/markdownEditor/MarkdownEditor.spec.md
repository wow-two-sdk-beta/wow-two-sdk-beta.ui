# MarkdownEditor

## Purpose
Markdown input with live HTML preview. Toolbar inserts common syntax around the selection. Uses `marked` for parsing.

## Anatomy
```
<MarkdownEditor>
  ├── Toolbar (Bold / Italic / Code / Link / List / Quote / H1 / H2)
  └── Body
       ├── editor pane (textarea)
       └── preview pane (rendered HTML)
</MarkdownEditor>
```

`view`: `'split' | 'edit' | 'preview'` — three modes.

## Required behaviors
- Toolbar buttons wrap the current selection (or insert at cursor) with markdown syntax.
- Edit pane is a `<textarea>` (no syntax highlighting; first-gen).
- Preview re-renders on `value` change via `marked.parse(value)`.
- `renderPreview` prop overrides the parser if consumer wants to swap engines.

## Visual states
`split` (default) · `edit` (full-width edit) · `preview` (full-width preview) · `disabled` · `read-only`

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | controlled | uncontrolled | |
| `view` / `defaultView` / `onViewChange` | controlled | `'split'` | |
| `renderPreview` | `(markdown: string) => ReactNode` | uses `marked.parse` | Custom parser |
| `disabled` / `readOnly` | `boolean` | `false` | |
| `minHeight` | `string` | `'18rem'` | |

## Composition
Single component; toolbar internal. `renderPreview` slot lets consumers route to MDX, `marked` with extensions, `markdown-it`, etc.

## Accessibility
- Toolbar = `role="toolbar"`; each button has `aria-label`.
- View mode = segmented control (`role="radiogroup"`).
- Editor pane: `<textarea>` with native semantics.
- Preview pane: `aria-live="polite"` so SR users get notified of changes.

## Dependencies
Foundation: `utils`, `icons`. Same domain: nothing. External: `marked`.
