# MeterBar

## Purpose
Like `ProgressBar`, but the fill color reflects threshold zones (green / amber / red). Use for usage gauges, capacity, score meters.

## Props
| Name | Type | Default |
|---|---|---|
| `value` | `number` | — (required) |
| `max` | `number` | `100` |
| `thresholds` | `[number, number]` | `[max*0.7, max*0.9]` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `label` | `string` | — |

## Dependencies
Foundation: `utils/cn`.
