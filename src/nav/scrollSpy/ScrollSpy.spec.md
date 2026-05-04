# ScrollSpy

## Purpose
Observe a list of section elements and emit which one is currently in view. Building block for `TableOfContents` and any scroll-driven highlight UI.

## Anatomy
Headless / hook-shaped. Renders nothing by default; an optional `children` render prop receives `{ activeId }`.

## Required behaviors
- Watches the provided IDs via `IntersectionObserver`.
- Emits the topmost intersecting section as `activeId`.
- Updates on scroll/resize.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `ids` | `string[]` | — | Element IDs to observe. |
| `rootMargin` | `string` | `'0px 0px -60% 0px'` | Bias the "active" zone toward the top of the viewport. |
| `threshold` | `number \| number[]` | `0` | IO threshold. |
| `onActiveChange` | `(id: string \| null) => void` | — | Imperative subscription. |
| `children` | `(ctx: { activeId: string \| null }) => ReactNode` | — | Render-prop variant. |

Hook variant: `useScrollSpy(ids, opts)` returns `activeId`.

## Dependencies
Foundation only. No cross-domain.
