# Highlight

## Purpose
Wraps each occurrence of `query` inside the text children in a `<Mark>`. Case-insensitive. Use for search-result highlighting.

## Props
| Name | Type | Default |
|---|---|---|
| `children` | `string` | — (required) |
| `query` | `string \| string[]` | — (required) |
| `wholeWord` | `boolean` | `false` |

## Dependencies
Foundation: `utils/cn`. Same-domain: `Mark`.
