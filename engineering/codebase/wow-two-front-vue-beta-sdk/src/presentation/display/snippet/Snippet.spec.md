# Snippet

## Purpose
Code text with a built-in copy button. Inline (single line) or block (multi-line) variant.

## Props
| Name | Type | Default |
|---|---|---|
| `text` | `string` | — (required) |
| `variant` | `'inline' \| 'block'` | `'inline'` |

## Dependencies
Foundation: `utils/cn`, `icons/Icon`, `hooks/useClipboard`. Same-domain: `Code`.
Notes: copy button is rendered inline (raw `<button>`) since `actions/CopyButton` lives in a sibling domain.
