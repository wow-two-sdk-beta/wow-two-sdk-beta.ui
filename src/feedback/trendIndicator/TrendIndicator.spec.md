# TrendIndicator

## Purpose
Up / down / flat arrow + value + optional label. Pass `inverse` for metrics where higher is worse (error rate, churn).

## Props
| Name | Type | Default |
|---|---|---|
| `value` | `number` | — (required) |
| `format` | `(v: number) => ReactNode` | `${sign}${v}%` |
| `inverse` | `boolean` | `false` |
| `label` | `ReactNode` | — |
| `size` | `'xs' \| 'sm' \| 'md'` | `'sm'` |

## Dependencies
Foundation: `utils/cn`, `icons/Icon`.
