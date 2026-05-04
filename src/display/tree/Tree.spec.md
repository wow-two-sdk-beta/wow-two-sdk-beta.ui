# Tree

## Purpose
Hierarchical list with expandable folder nodes and selectable leaf nodes. Use for file trees, navigation hierarchies, taxonomy browsers.

## Anatomy
```
<Tree>
  ├── <Tree.Group label value>      (expandable folder)
  │     ├── <Tree.Item value>       (leaf)
  │     └── <Tree.Group ...>        (nested)
  │   </Tree.Group>
  └── <Tree.Item value>
</Tree>
```

## Required behaviors
- Click on a `Tree.Group` header toggles its expansion.
- Click on a `Tree.Item` selects it (calls `onSelect`).
- ↑/↓ arrows move focus across visible nodes (roving tabindex).
- Home/End jump to first/last visible.
- ARIA: container `role="tree"`; folders + leaves `role="treeitem"`. Folders carry `aria-expanded`. Selected leaf carries `aria-selected="true"`.

## Visual states (per node)
`default` · `hover` · `focus-visible` · `expanded` (folder) · `selected` (leaf)

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `selectedValue` | `string \| null` | — | no | Controlled selection. |
| `defaultSelectedValue` | `string \| null` | `null` | no | Uncontrolled. |
| `onSelectionChange` | `(value) => void` | — | no | Selection callback. |
| `expanded` | `string[]` | — | no | Controlled set of expanded group values. |
| `defaultExpanded` | `string[]` | `[]` | no | Uncontrolled. |
| `onExpandedChange` | `(values) => void` | — | no | Expansion callback. |

`Tree.Group`: `value`, `label`, `disabled?`. `Tree.Item`: `value`, `disabled?`.

## Composition
Compound. Tree root manages selected + expanded sets. Groups/items participate via context.

## Accessibility
- WAI-ARIA Tree pattern (selection model, single).
- Indentation reflects `aria-level` for screen readers.

## Known limitations
- ←/→ arrows for expand/collapse not implemented (defer to P6).
- No type-to-search.
- No multi-selection.
- No virtualization — large trees should render lazily by the consumer.

## Inspirations
- Mantine `Tree`.
- Ark UI `Tree View`.
- shadcn doesn't ship one — this is custom.
