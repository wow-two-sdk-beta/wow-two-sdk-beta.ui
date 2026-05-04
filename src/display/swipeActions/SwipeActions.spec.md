# SwipeActions

## Purpose
Touch-row pattern: drag a row left/right to reveal action buttons (delete, archive, pin). Common in mobile lists.

## Anatomy
```
<SwipeActions left={<…/>} right={<…/>}>
  <row content/>
</SwipeActions>
```

## Required behaviors
- Swipe past threshold → snap-open with actions visible.
- Tap content while open → close.
- Tap an action → fire `onAction` (consumer wires).
- Mouse drag also works (desktop demoability).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `left` | `ReactNode` | — | Action(s) revealed by swipe-right |
| `right` | `ReactNode` | — | Action(s) revealed by swipe-left |
| `threshold` | `number` (px) | `60` | Minimum drag to trigger snap-open |
| `actionWidth` | `number` (px) | `72` | Width of each action button (used for snap distance) |
| `disabled` | `boolean` | `false` | |

## Accessibility
- Actions are real `<button>`s — keyboard users tab to them directly (the swipe is a touch-only convenience).
- Container is `role="listitem"` (consumer can override).

## Dependencies
Foundation: `utils`. No cross-domain.
