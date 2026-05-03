# BadgeOverlay

## Purpose
Decorator wrapper that overlays a badge / dot on top of a child element. Pattern: `<BadgeOverlay badge={<NotificationDot />}><Avatar /></BadgeOverlay>` or with `<CountBadge>` for inbox counts.

## Props
| Name | Type | Default |
|---|---|---|
| `children` | `ReactNode` | — (required) |
| `badge` | `ReactNode` | — (required) |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` |
| `hidden` | `boolean` | `false` |

## Dependencies
Foundation: `utils/cn`.
