# Sparkline

## Purpose
Inline tiny chart for trends — line / area / bar / dot. SVG-based; no scales, no axes, no legend. Designed to sit beside a number (`Stat`) or in a table cell.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `data` | `number[]` | required | Series values |
| `variant` | `'line' \| 'area' \| 'bar' \| 'dot'` | `'line'` | |
| `width` / `height` | `number` (px) | `120` / `32` | |
| `tone` | `'brand' \| 'success' \| 'warning' \| 'danger' \| 'muted' \| 'current'` | `'brand'` | Color via `currentColor` (when `current`) or token |
| `min` / `max` | `number` | derived from data | Override scale |
| `showLast` | `boolean` | `false` | Add a dot at the last point |
| `ariaLabel` | `string` | `'Trend'` | SR-only summary (e.g. "Sales: 12, 15, 19, 24"). |

## Accessibility
- `role="img"` + `aria-label`.
- Chart visuals are decorative; consumers should provide `ariaLabel` summarizing the trend.

## Dependencies
Foundation: `utils`. No external libs.
