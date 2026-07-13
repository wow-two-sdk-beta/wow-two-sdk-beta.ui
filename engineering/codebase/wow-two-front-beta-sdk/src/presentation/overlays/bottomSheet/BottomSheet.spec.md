# BottomSheet

## Purpose
Mobile-style bottom sheet with drag handle and snap points. Drag-to-resize between configurable heights; drag-to-dismiss past the lowest snap.

## Anatomy
```
<BottomSheet open onOpenChange snapPoints={[200, 400, '90vh']} initialSnap={1}>
  ├── drag handle
  ├── header? (Title / Description)
  └── body content
</BottomSheet>
```

## Required behaviors
- Snap points define the heights the sheet rests at (px or CSS unit).
- Drag handle (visible) drags the sheet between snaps.
- Releasing snaps to the nearest point.
- Past the lowest snap → dismiss.
- Backdrop scrim, click-to-dismiss, Escape-to-dismiss.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `open` / `defaultOpen` / `onOpenChange` | controlled | uncontrolled | |
| `snapPoints` | `(number \| string)[]` | `['40vh', '90vh']` | px or CSS units |
| `initialSnap` | `number` | `0` | Index into `snapPoints` |
| `dismissOnOutsideClick` | `boolean` | `true` | |
| `dismissOnEscape` | `boolean` | `true` | |
| `dragToDismiss` | `boolean` | `true` | |

## Accessibility
- Wraps `Drawer` (`side="bottom"`) — inherits FocusScope, Backdrop, ScrollLock.
- Drag handle is `role="separator"` with `aria-orientation="horizontal"` + arrow-key snap navigation.

## Dependencies
Foundation: `utils`, `hooks/useControlled`. Same domain: `overlays/Drawer` (chrome wiring), `overlays/Backdrop`. Cross-domain: none.
