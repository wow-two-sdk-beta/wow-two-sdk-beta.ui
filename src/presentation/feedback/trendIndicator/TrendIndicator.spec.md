# TrendIndicator

## Purpose
Up / down / flat arrow + value + optional label. Pass `isInverse` for metrics where higher is worse (error rate, churn).

## Props
| Name | Type | Default |
|---|---|---|
| `value` | `number` | — (required) |
| `format` | `(v: number) => ReactNode` | `${sign}${v}%` |
| `isInverse` | `boolean` | `false` |
| `label` | `ReactNode` | — |
| `size` | `'xs' \| 'sm' \| 'md'` | `'sm'` |

## Dependencies
Foundation: `utils/cn`, `icons/Icon`.
