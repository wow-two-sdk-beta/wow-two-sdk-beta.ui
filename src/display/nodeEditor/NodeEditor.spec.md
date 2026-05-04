# NodeEditor

## Purpose
Visual graph editor: draggable nodes connected by edges. First-generation supports node positioning + drag-to-move + edges as SVG bezier paths + viewport pan/zoom. Drag-to-connect (port-out → port-in) is deferred — for now consumers add edges programmatically.

## Anatomy
```
<NodeEditor nodes edges onNodesChange? onEdgeClick?>
  ├── viewport (pan/zoom container)
  │   ├── SVG layer (edges, beneath nodes)
  │   └── Node layer (positioned absolute by x/y)
  └── controls (zoom in/out/reset)
</NodeEditor>
```

## Required behaviors
- Nodes positioned by `x`/`y` (in graph coords).
- Drag a node → updates its position (controlled via `onNodesChange`).
- Pan viewport with click-empty-and-drag.
- Wheel scroll → zoom (clamped 0.25–2).
- Edges drawn as cubic bezier between source.x+w/2, source.y+h/2 and target.x+w/2, target.y+h/2 (or source/target ports if specified).
- Click edge → fire `onEdgeClick`.
- Built-in zoom controls (+, −, fit).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `nodes` | `NodeEditorNode[]` | required | |
| `edges` | `NodeEditorEdge[]` | `[]` | |
| `onNodesChange` | `(nodes: NodeEditorNode[]) => void` | — | Required for drag |
| `onEdgeClick` | `(edge: NodeEditorEdge) => void` | — | |
| `renderNode` | `(node) => ReactNode` | default card | |
| `nodeWidth` / `nodeHeight` | `number` (px) | `160` / `60` | |
| `minZoom` / `maxZoom` | `number` | `0.25` / `2` | |

## Composition
Single component; viewport state internal. Future iteration adds `<NodeEditor.Node>` / `<NodeEditor.Edge>` compound API + `useNodeEditor()` hook.

## Accessibility
- Best-effort: each node renders with `role="group"` + `aria-label`.
- Pan/zoom is mouse/touch only (no keyboard pan today).
- Edges are `<path role="presentation">` (no SR semantics).

## Dependencies
Foundation: `utils`. No external libs (own minimal impl). Future iteration may swap to React Flow under the same contract.

## Known limitations (deferred to follow-up)
- Drag-to-connect ports (drag from output → drop on input).
- Multi-select + rubber-band select.
- Auto-layout (dagre/elk).
- Minimap.
- Subflows.
- Per-edge label, marker arrows.
- Snap-to-grid.
- Undo/redo.
- Keyboard pan/zoom.
