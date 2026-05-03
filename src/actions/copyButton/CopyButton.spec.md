# CopyButton

## Purpose
One-click clipboard copy. Default rendering is icon-only with a checkmark swap on success; pass `children` (string or render-prop) to customize.

## Props
| Name | Type | Default |
|---|---|---|
| `text` | `string` | — (required) |
| `resetAfter` | `number` (ms) | `2000` |
| `children` | `ReactNode \| ({copied}) => ReactNode` | icon swap |
| `aria-label` | `string` | `'Copy'` |
| ...rest | `ButtonProps` (variant/size/etc.) | from Button |

## Dependencies
Foundation: `icons/Icon`, `hooks/useClipboard`. Same-domain: `Button`.
