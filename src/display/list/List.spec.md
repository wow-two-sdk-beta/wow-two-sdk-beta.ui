# List

## Purpose
Semantic `<ul>` / `<ol>` with consistent spacing, marker presets, and an `Item` subcomponent that supports primary/secondary content + leading/trailing slots. Use for navigation lists, settings groups, simple data lists.

This is L4: **basic list semantics + presets**. For interactive selection lists with keyboard nav, use `forms/Listbox`. For long virtualized lists, defer to a future component.

## Anatomy
```
<List>
  ├── <List.Item leading? trailing?>
  │     children = primary content
  │   </List.Item>
  └── ...more items
</List>
```

## Required behaviors
- Renders `<ul>` (default) or `<ol>` (when `ordered`).
- `marker` prop: `'none' | 'disc' | 'decimal' | 'check'` controls bullet style.
- `Item` accepts `leading` (icon/avatar) + `trailing` (badge/chevron) slots.
- ARIA: native list semantics, no extra roles.

## Visual states
`default` — list items are non-interactive by default. For clickable items, wrap children in a `Button` or `Link`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `ordered` | `boolean` | `false` | no | Render as `<ol>`. |
| `marker` | `'none' \| 'disc' \| 'decimal' \| 'check'` | `'none'` | no | Bullet preset. |
| `spacing` | `'tight' \| 'normal' \| 'loose'` | `'normal'` | no | Item spacing. |

`List.Item`: `leading?`, `trailing?`, `children`.

## Composition
Self-contained. Distinct from `forms/Listbox` (selection) and a future virtualized/data-bound list.

## Dependencies
Foundation: `utils/cn`. Same-domain: none.

## Known limitations
- No nested-list indentation helper (consumer composes manually).
- No virtualization.

## Inspirations
- MUI `List`.
- Mantine `List`.
