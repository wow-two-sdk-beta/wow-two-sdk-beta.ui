# HeatmapCalendar

## Purpose
GitHub-contributions style year heatmap. Each cell = a day; intensity color encodes a per-day metric. Weeks laid out as columns; weekday rows.

## Anatomy
```
<HeatmapCalendar values={Map<dateString, number>} year={2026}>
  ├── month labels row
  ├── grid (53 cols × 7 rows)
  └── legend (less → more)
</HeatmapCalendar>
```

## Required behaviors
- Render every day from year start to year end.
- Map per-day value → 5-step intensity (no value = empty cell).
- Hover/focus tooltip ("2026-03-12: 12 contributions").
- Optional click handler per cell.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `values` | `Record<string, number> \| Map<string, number>` | required | Keyed by `YYYY-MM-DD` |
| `year` | `number` | current year | |
| `weekStart` | `0 \| 1` | `0` (Sun) | |
| `cellSize` | `number` (px) | `12` | |
| `gap` | `number` (px) | `2` | |
| `levels` | `number` | `5` | Intensity buckets (0..levels-1) |
| `tone` | `SparklineTone` | `'brand'` | |
| `onCellClick` | `(date: string, value: number) => void` | — | |
| `monthLabels` | `string[]` | `['Jan',...]` | |
| `weekdayLabels` | `string[]` | `['Sun',...]` | |
| `showLegend` | `boolean` | `true` | |

## Accessibility
- Each cell is a `<button>` with `aria-label` ("2026-03-12: 12").
- Levels reflected as `aria-valuenow`.

## Dependencies
Foundation: `utils`. No cross-domain. No external libs.
