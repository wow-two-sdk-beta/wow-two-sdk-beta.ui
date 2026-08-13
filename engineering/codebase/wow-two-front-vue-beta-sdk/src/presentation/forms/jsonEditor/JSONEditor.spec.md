# JSONEditor

## Purpose
Edit JSON either as raw text (with parse-validation) or via a collapsible tree view. Single source of truth: a JS value (`unknown`); both modes serialize/deserialize on commit.

## Anatomy
```
<JSONEditor>
  ├── ModeToggle (Tree | Text)
  └── Body
       ├── Tree mode: nested rows with type icons, expand/collapse, copy-path
       └── Text mode: <textarea> with validation gutter
</JSONEditor>
```

## Required behaviors
- Two modes: `tree` (default) and `text`. Toggle preserves data when valid.
- Tree mode: collapsible nodes for objects/arrays; per-leaf inline edit (string/number/boolean/null).
- Text mode: `JSON.parse` on commit; surface error inline; revert on Escape.
- "Copy path" per node (`a.b[2].c`).

## Visual states
`tree` · `text` · `disabled` · `read-only` · `parse-error`

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | `unknown` | `{}` | Live JS value |
| `mode` / `defaultMode` / `onModeChange` | `'tree' \| 'text'` | `'tree'` | |
| `disabled` / `readOnly` | `boolean` | `false` | |
| `indent` | `number` | `2` | Spaces in text mode |
| `minHeight` | `string` | `'14rem'` | |

## Composition
Single component (mode internal). No compound surface.

## Accessibility
- Tree mode: `role="tree"` + nodes `role="treeitem"` + `aria-expanded`.
- Text mode: `<textarea>` + linked error message.

## Dependencies
Foundation: `utils`, `icons`. Same domain: `forms/InputStyles`. No cross-domain.

## Known limitations
- No schema validation, no per-key restriction, no object-key reordering.
- Inline edit accepts only primitives — to add a key/object, switch to text mode.
