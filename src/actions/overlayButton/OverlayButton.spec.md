# OverlayButton

## Purpose
Icon button positioned absolutely over its parent — image hover affordances, close buttons on cards, edit-overlays. Translucent dark fill with backdrop blur for legibility on any background.

## Props
| Name | Type | Default | Required |
|---|---|---|---|
| `aria-label` | `string` | — | yes |
| `size` | `'xs' \| 'sm' \| 'md'` | `'sm'` | no |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left' \| 'center'` | `'top-right'` | no |
| `appearOn` | `'always' \| 'hover'` | `'always'` | no |

`appearOn="hover"` requires the parent to have `className="group"`.

## Dependencies
Foundation: `utils/cn`, `tailwind-variants`.
