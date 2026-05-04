# ActionSheet

## Purpose
iOS-style list of actions sliding up from the bottom of the viewport. Mobile-first counterpart to a Menu/DropdownMenu.

## Anatomy
```
<ActionSheet open onOpenChange title? description?>
  ├── ActionSheet.Action onSelect>     ← per row
  ├── ActionSheet.Action destructive>  ← red text variant
  └── ActionSheet.Cancel               ← bottom, separated, dismisses
</ActionSheet>
```

## Required behaviors
- Backdrop scrim + slide-up animation.
- Click outside / Escape / Cancel → close.
- Each `Action` is a real `<button>` row.
- Destructive variant uses `text-destructive`.

## Props (root)
| Name | Type | Default | Why |
|---|---|---|---|
| `open` / `defaultOpen` / `onOpenChange` | controlled | uncontrolled | |
| `title` | `ReactNode` | — | Section header |
| `description` | `ReactNode` | — | Section sub-text |

## Action props
| Name | Type | Default | Why |
|---|---|---|---|
| `onSelect` | `() => void` | — | Closes sheet after firing |
| `destructive` | `boolean` | `false` | Red text |
| `disabled` | `boolean` | `false` | |

## Composition
Compound — leans on `overlays/Drawer` (`side="bottom"`) for animation + a11y wiring; adds the opinionated row styling + `Cancel` button.

## Dependencies
Foundation: `utils`. Same domain: `overlays/Drawer`.
