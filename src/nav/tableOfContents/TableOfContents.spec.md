# TableOfContents

## Purpose
Auto-generated outline of headings in a document, paired with `ScrollSpy` to highlight the section currently in view.

## Anatomy
```
<TableOfContents items=[{ id, label, depth }] />
```

Or auto-extract from a container:
```
<TableOfContents source={containerRef} headingSelector="h2, h3" />
```

## Required behaviors
- Click an entry → scroll target heading into view.
- Active entry highlighted via internal `useScrollSpy` (or controlled via `activeId`).
- Indent entries by `depth`.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `items` | `{ id: string; label: ReactNode; depth?: number }[]` | — | Explicit list. |
| `source` | `RefObject<HTMLElement>` | — | Auto-extract headings from this element. |
| `headingSelector` | `string` | `'h2, h3'` | Used with `source`. |
| `activeId` | `string \| null` | derived from ScrollSpy | Override active state. |
| `sticky` | `boolean` | `false` | Sticky positioning helper class. |

## Dependencies
Foundation: `utils`. Same domain: `nav/ScrollSpy`.
