# Gantt

## Purpose
Tasks × time chart. Each task has a `start`/`end` (Date); rendered as a horizontal bar. Optional dependencies drawn as SVG arrows (FS = finish→start). "Today" indicator vertical line.

## Anatomy
```
<Gantt tasks dependencies? from? to?>
  ├── label column (task names)
  └── timeline
       ├── header (months/weeks/days based on cellWidth)
       ├── per-task row
       │   └── bar (positioned by start/end)
       └── SVG dependency layer (arrows)
       └── today indicator (vertical line)
</Gantt>
```

## Required behaviors
- Auto-derive `from`/`to` from min/max task dates if not provided.
- `cellWidth` (px per day) controls horizontal scale.
- Optional `milestones` array (single-day diamond markers).
- Optional `dependencies: Array<{ from: taskId, to: taskId }>` rendered as right-angle arrows.
- "Today" = vertical line at today's x position when within range.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `tasks` | `Array<{ id; label; start; end; color?; progress?: 0..1 }>` | required | |
| `dependencies` | `Array<{ from; to }>` | `[]` | |
| `milestones` | `Array<{ id; label; date }>` | `[]` | |
| `from` / `to` | `Date` | derived | Visible range |
| `cellWidth` | `number` (px/day) | `40` | |
| `rowHeight` | `number` (px) | `36` | |
| `showWeekends` | `boolean` | `true` | Shade Sat/Sun |
| `onTaskClick` | `(task) => void` | — | |

## Accessibility
- `role="grid"` on root; bars `role="button"` with `aria-label` (label + date range + progress).
- No keyboard nav between bars yet (deferred).

## Dependencies
Foundation: `utils`. Same domain: nothing. No external libs.

## Known limitations (deferred)
- No drag-to-resize/move.
- No critical-path highlight.
- No row collapsing / grouping.
- No weekend skipping in computations.
- Auto-zoom level (week vs month grouping in header) — currently always day-level.
