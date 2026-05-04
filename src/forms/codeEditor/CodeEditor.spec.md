# CodeEditor

## Purpose
Lightweight code-input field with line numbers and Tab handling. **First-generation** — no syntax highlighting; the surface is a styled `<textarea>`. Real IDE features (highlighting, IntelliSense, multi-cursor) are deferred to a follow-up that wraps Monaco / CodeMirror inside this contract.

## Anatomy
```
<CodeEditor>
  ├── line number gutter
  └── textarea
</CodeEditor>
```

## Required behaviors
- `value` / `onValueChange` controlled or uncontrolled.
- Tab key inserts `tabSize` spaces (or a literal `\t`); Shift+Tab outdents.
- Line numbers regenerate from line count.
- Vertical scroll syncs gutter ↔ textarea.
- Monospace font, dark background tone.

## Visual states
`default` · `focus` · `disabled` · `read-only`

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | controlled | uncontrolled | |
| `language` | `string` | — | Hint for future engine routing; today purely informational. |
| `tabSize` | `number` | `2` | Number of spaces per tab |
| `useTabs` | `boolean` | `false` | Insert literal tab char instead of spaces |
| `disabled` / `readOnly` | `boolean` | `false` | |
| `placeholder` | `string` | — | |
| `minHeight` | `string` | `'12rem'` | CSS height |
| `name` | `string` | — | Form field name |

## Composition
Single component. No compound surface.

## Accessibility
- `<textarea>` retains semantics; consumers should pair with `<Label>` / `formField`.
- Line number gutter is `aria-hidden` decorative.

## Dependencies
Foundation: `utils`. Same domain: `forms/InputStyles`. No cross-domain.

## Known limitations
- **No syntax highlighting** — `language` prop is forward-compat only.
- No find/replace, multi-cursor, code folding, IntelliSense, linting, LSP.
- For real IDE features, install `@monaco-editor/react` or `@uiw/react-codemirror` separately and wrap them in your app.
