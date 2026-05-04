# SpeedDial

## Purpose
Floating Action Button with a stack of secondary actions that fan out when triggered. The trigger replaces a single FAB; tapping/clicking opens the stack.

## Anatomy
```
<SpeedDial position="bottom-right">
  <SpeedDial.Trigger>          ← FAB-shaped button (closed = "+", open = "×")
  <SpeedDial.Action onSelect>  ← per radial item (small circular button + label)
  <SpeedDial.Action onSelect>
</SpeedDial>
```

Items render as a flex stack offset from the trigger. Direction derived from `position`.

## Required behaviors
- Click trigger → toggle open. Open state animates each item in with a stagger.
- Click outside or Escape → close.
- Each `Action` button is focusable; `Tab` cycles through items in order.
- `aria-haspopup="menu"` on trigger; items are real `<button>` elements in a `role="menu"` container.

## Visual states
`closed` · `open` · `hover` · `disabled`

## Props (root)
| Name | Type | Default | Why |
|---|---|---|---|
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Mirrors `FAB`'s positions; deciding fan direction. |
| `direction` | `'up' \| 'down' \| 'left' \| 'right'` | derived from `position` | Override the auto-direction. |
| `open` / `defaultOpen` / `onOpenChange` | controlled state | uncontrolled by default | |
| `gap` | `number` (px) | `12` | Spacing between items. |

## Action props
| Name | Type | Why |
|---|---|---|
| `aria-label` | `string` (required) | |
| `onSelect` | `() => void` | Fires on click; closes the speed-dial. |
| `tooltip` | `ReactNode` | Renders a small label adjacent to the action. |
| `icon` | `ReactNode` | Required visible content. |

## Composition model
Compound (`SpeedDial.Trigger / Action`). Root owns open state. The trigger is the FAB; secondary actions stack relative to it. We do *not* compose `Popover` directly — speed-dial geometry (linear stack offset from trigger) is too specific to share Popover's anchored positioning. We re-export `direction` for consumers who want a non-default fan.

## Accessibility
- Trigger: `aria-haspopup="menu"` + `aria-expanded`.
- Action stack: `role="menu"`. Each action: `role="menuitem"`.
- Escape closes; focus returns to trigger.
- Click-outside closes.

## Dependencies
Foundation: `utils`, `hooks/useEscape`, `hooks/useOutsideClick`. Same domain: `FAB`. No cross-domain.

## Inspirations
MUI `SpeedDial`. Ours: simpler — no tooltip styling beyond a flush label, single render-tree (no Popover indirection).
