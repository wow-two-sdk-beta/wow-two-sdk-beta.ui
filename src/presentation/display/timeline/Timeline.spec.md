# Timeline

## Purpose
Vertical activity / event feed — markers connected by a line, each with title + body content. Use for audit logs, build histories, onboarding progress, project changelogs.

## Anatomy
```
<Timeline>
  ├── <Timeline.Item icon? status?>
  │     ├── <Timeline.Title>
  │     ├── <Timeline.Description>
  │     └── (any children)
  │   </Timeline.Item>
  └── ...more items
</Timeline>
```

## Required behaviors
- Renders an `<ol>` with each item showing a circular marker connected to the next via a vertical line.
- The last item omits the connecting line below.
- `status` controls marker color: `default` (muted), `primary`, `success`, `warning`, `destructive`, `info`.
- Optional `icon` replaces the default dot inside the marker circle.

## Visual states (per item)
`default` · `primary` · `success` · `warning` · `destructive` · `info`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `align` | `'left' \| 'right'` | `'left'` | no | Marker side. |

`Timeline.Item`: `icon?`, `status?`, `children`.

## Composition
Compound. Each `Timeline.Item` is a list item with positioned marker.

## Dependencies
Foundation: `utils/cn`. Same-domain: none.

## Known limitations
- No alternating left/right layout (zigzag) — use `align="left"` or `"right"` consistently.
- No "load more" pagination.

## Inspirations
- Mantine `Timeline`.
- MUI Lab `Timeline`.
