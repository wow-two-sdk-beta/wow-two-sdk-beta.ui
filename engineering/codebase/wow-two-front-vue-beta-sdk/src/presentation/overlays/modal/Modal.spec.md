# Dialog

## Purpose
Modal dialog — blocking overlay that traps focus and dims the page. Use for destructive confirmations, complex forms, or any flow that requires user attention before continuing. For a less-blocking variant, use `Popover`. For a side-anchored variant, use `Drawer`.

## Anatomy
```
<Dialog>
  ├── <Dialog.Trigger asChild?>
  └── <Dialog.Content>
        ├── <Dialog.Header>
        │     ├── <Dialog.Title>
        │     └── <Dialog.Description>
        ├── <Dialog.Body>
        ├── <Dialog.Footer>
        └── <Dialog.Close asChild?>     (X button or custom close)
      </Dialog.Content>
</Dialog>
```

## Required behaviors
- Trigger click opens. Escape, outside click, close button close.
- Focus moves into the dialog on open; returns to trigger on close.
- Body scroll locked while open.
- ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby={titleId}`, `aria-describedby={descriptionId}`.
- Backdrop click optional dismissal (configurable).

## Visual states
`open` (animated in) · `closed`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `open` | `boolean` | — | no | Controlled. |
| `defaultOpen` | `boolean` | `false` | no | Uncontrolled initial. |
| `onOpenChange` | `(open) => void` | — | no | Open-state callback. |
| `dismissOnOutsideClick` | `boolean` | `true` | no | Click on backdrop closes. |
| `dismissOnEscape` | `boolean` | `true` | no | Escape closes. |

## Composition
Compound. Trigger anchors the open state, Content portals + traps focus + locks scroll.

## Accessibility
- WAI-ARIA Dialog (Modal) pattern.
- Focus trap (`@radix-ui/react-focus-scope`).
- Title required (linked via `aria-labelledby`); description optional.

## Known limitations
- No nested-dialog stack manager (multiple dialogs may stack via `DismissableLayer`'s built-in stack, but no explicit z-index management beyond DOM order).
- No animation customization (uses `animate-in fade-in-0 zoom-in-95`).
- No size variants (caller styles `Dialog.Content` width).

## Inspirations
- Radix `Dialog`.
- shadcn/ui `Dialog`.
