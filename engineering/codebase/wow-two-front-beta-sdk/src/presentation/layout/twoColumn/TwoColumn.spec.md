# TwoColumn

## Purpose
Two-pane layout — fixed-width aside + flexible main. Common for sidebar+content, filter+results, TOC+article.

## Props
| Name | Type | Default |
|---|---|---|
| `aside` | `ReactNode` | — (required) |
| `children` | `ReactNode` (main) | — (required) |
| `asideWidth` | `string` (Tailwind class) | `'w-64'` |
| `asideSide` | `'left' \| 'right'` | `'left'` |
| `gap` | `'0' \| '4' \| '6' \| '8' \| '10'` | `'6'` |

## Dependencies
Foundation: `utils/cn`.
