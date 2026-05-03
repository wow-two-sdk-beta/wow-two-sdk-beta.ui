# DisclosureButton

## Purpose
Trigger button with a chevron that rotates on open. Common as the header of a collapsible section, accordion item, or sidebar group. Sets `aria-expanded` and `data-state`.

## Props
| Name | Type | Default |
|---|---|---|
| `open` | `boolean` | controlled |
| `defaultOpen` | `boolean` | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `chevronSide` | `'left' \| 'right'` | `'right'` |
| `children` | `ReactNode` | — |

## Dependencies
Foundation: `utils/cn`, `utils/dataAttr`, `icons/Icon`, `hooks/useControlled`.
