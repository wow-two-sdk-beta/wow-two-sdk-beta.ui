# Drawer

## Purpose
Side-anchored modal — slides in from the edge of the viewport. Use for navigation drawers, side panels, slide-over sheets, mobile bottom sheets.

## Anatomy
```
<Drawer side?>
  ├── <Drawer.Trigger asChild?>
  └── <Drawer.Content>
        ├── <Drawer.Header>
        │     ├── <Drawer.Title>
        │     └── <Drawer.Description>
        ├── <Drawer.Body>
        ├── <Drawer.Footer>
        └── <Drawer.Close asChild?>
      </Drawer.Content>
</Drawer>
```

## Required behaviors
- Same modal mechanics as `Dialog` (focus trap, scroll lock, backdrop, dismissal).
- `side` prop chooses anchor edge: `'right'` (default), `'left'`, `'top'`, `'bottom'`.
- Animations: slide-in from the chosen edge.

## Visual states
`open` (animated in) · `closed`

## Props
Same as `Dialog` plus:
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` | no | Edge to anchor against. |

## Composition
Same-domain reuse of `Backdrop` and `Dialog`-shaped header/body/footer/close. State machinery is local (own context) since the wrapper layout differs from `Dialog`.

## Accessibility
- WAI-ARIA Dialog (Modal) pattern — same as `Dialog` (`role="dialog"`, `aria-modal="true"`).

## Known limitations
- No drag-to-dismiss gesture (deferred to P6).
- Width / height fixed per side via Tailwind defaults — caller can override via class on `Drawer.Content`.

## Inspirations
- shadcn/ui `Sheet`.
- Radix `Dialog` with positioning override.
- Mantine `Drawer`.
