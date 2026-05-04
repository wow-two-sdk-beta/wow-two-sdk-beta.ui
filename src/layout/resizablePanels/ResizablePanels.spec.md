# ResizablePanels

## Purpose
Split-pane layout with draggable separators. Each panel claims a percentage of the container; user drags a separator to redistribute between immediate siblings.

## Anatomy
```
<ResizablePanels orientation="horizontal">
  <ResizablePanels.Panel defaultSize={30} minSize={15}>
  <ResizablePanels.Separator>
  <ResizablePanels.Panel defaultSize={70} minSize={20}>
</ResizablePanels>
```

Sizes are stored as percentages summing to ~100. Separators sit *between* panels — n panels → n-1 separators.

## Required behaviors
- Drag a separator → adjusts the panels immediately before / after by the drag delta (clamped by `minSize`/`maxSize`).
- Keyboard on focused separator: arrow keys nudge by 1% (Shift = 10%).
- Double-click separator → reset to default ratio.
- Disabled separator: no drag, no keyboard.

## Visual states
`default` · `hover` · `dragging` · `focus-visible` · `disabled`

## Props (root)
| Name | Type | Default | Why |
|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Horizontal = row of vertical panels. |
| `defaultSizes` | `number[]` | derived from `defaultSize` props | Override per-panel default. |
| `sizes` / `onSizesChange` | controlled | uncontrolled | Controlled sizes. |

## Panel props
| Name | Type | Default | Why |
|---|---|---|---|
| `defaultSize` | `number` (%) | equal split | |
| `minSize` | `number` (%) | `0` | |
| `maxSize` | `number` (%) | `100` | |

## Separator props
| Name | Type | Default | Why |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Hides hover/cursor + ignores drag. |

## Composition model
Compound. Root reads child structure to count panels and bind separators. Sizes managed centrally. Children in order: `Panel · Separator · Panel · Separator · …`.

## Accessibility
- Each separator: `role="separator"` + `aria-orientation` + `aria-valuenow / aria-valuemin / aria-valuemax` reflecting the immediately-following panel's size.
- Keyboard arrow nudges value.
- Visual cursor: `col-resize` / `row-resize` based on orientation.

## Dependencies
Foundation: `utils`, `hooks/useEventListener`. No cross-domain.

## Inspirations
react-resizable-panels, allotment. Ours is a small clone — no nested-panel collapse, no persistence.
