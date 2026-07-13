# NavItem

## Purpose
Sidebar / nav row — icon + label + trailing slot + active state. Default `<a>`; pass `asChild` to render a router Link.

## Props
| Name | Type | Default |
|---|---|---|
| `icon` | `ReactNode` | — |
| `children` | `ReactNode` (label) | — |
| `trailing` | `ReactNode` (badge / dot) | — |
| `isActive` | `boolean` | `false` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `asChild` | `boolean` | `false` |

## Dependencies
Foundation: `utils/cn`, `utils/dataAttr`. Primitives: `Slot`.
