# UndoBar

## Purpose
Snackbar-style notification with a single "Undo" action. Common after destructive deletes ("Conversation deleted · Undo").

## Anatomy
```
<UndoBar>
  ├── message
  ├── countdown indicator (optional)
  └── Undo button
</UndoBar>
```

## Required behaviors
- `isOpen` controls mount.
- Auto-dismisses after `duration` (ms). `Infinity` = sticky.
- Click `Undo` → calls `onUndo`, closes.
- Pause-on-hover (configurable).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `isOpen` | `boolean` | — | Controlled |
| `onOpenChange` | `(open: boolean) => void` | — | |
| `message` | `ReactNode` | — | Body |
| `onUndo` | `() => void` | — | Action callback |
| `undoLabel` | `string` | `'Undo'` | |
| `duration` | `number` (ms) | `5000` | Auto-dismiss; `Infinity` = sticky |
| `canPauseOnHover` | `boolean` | `true` | |
| `position` | same union as Toaster | `'bottom-center'` | |
| `hasCountdown` | `boolean` | `false` | Render shrinking bar |

## Accessibility
- `role="status"` + `aria-live="polite"`.
- Undo button: real `<button>` with the action verb.

## Dependencies
Foundation: `utils`, `primitives/Portal`. Same domain: nothing — does not wrap Toaster (different lifecycle, different shape).
