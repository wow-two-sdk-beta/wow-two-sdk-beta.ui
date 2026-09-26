# Skeleton

## Purpose
Placeholders shaped like content that has not arrived. The block covers the three common shapes (rect / text-line /
circle); its parts cover the loading-region pattern — a first load, or a user-requested refresh, swaps a region's values
to placeholders while its labels and layout hold still.

## Parts
| Part | Renders | Use for |
|---|---|---|
| `Skeleton` | one block, sized by `className` | a known shape with no content yet |
| `Skeleton.Text` | `lines` text lines, the last at `lastLineWidth` | a paragraph |
| `Skeleton.Slot` | the real content, invisible, on a placeholder exactly its size | a value inside a loaded layout |
| `Skeleton.Group` | a region: `aria-busy`, one `role="status"` announcement, shared loading + animation | the owning region |

## Props
| Part | Name | Type | Default |
|---|---|---|---|
| `Skeleton` | `shape` | `'rect' \| 'text' \| 'circle'` | `'rect'` |
| all | `animation` | `'pulse' \| 'shimmer' \| 'none'` | the group's, else `'pulse'` |
| `Skeleton.Text` | `lines` | `number` | `3` |
| `Skeleton.Text` | `lastLineWidth` | `string` | `'60%'` |
| `Skeleton.Slot` | `loading` | `boolean` | the group's |
| `Skeleton.Slot` | `shape` | corners only | `'text'` |
| `Skeleton.Slot` | `block` | `boolean` — `div` wrapper for block content | `false` |
| `Skeleton.Group` | `loading` | `boolean` | required |
| `Skeleton.Group` | `label` | `string` | `'Loading…'` |

## Pattern
- First load: render the region inside `Skeleton.Group loading` with placeholder values, or `Skeleton` blocks when no
  content exists yet.
- User-requested refresh: drive the group with `useRefresh(refetch)` from `@wow-two-beta/ui/query`; it holds
  `refreshing` for at least 400 ms, so the swap is seen even when the numbers do not change.
- Identities (names, ids, paths) hold through a refresh: pin their slots with `loading={isPlaceholder}`, so only a
  first load hides them.
- Background refetch or polling: keep content; show freshness with a timestamp or `useAppQuery().fetching`.
- Motion respects `prefers-reduced-motion`; shapes are decorative, and only the group announces.

## Dependencies
Foundation: `utils/cn`, `tailwind-variants`; the `--animate-shimmer` token in `index.css`.
