# Popover

## Purpose
Click-triggered floating panel anchored to a trigger element. Use for rich content overlays that aren't full-screen modals — color pickers, share menus, settings panels, mini forms.

## Anatomy
```
<Popover>
  ├── <Popover.Trigger asChild?>
  └── <Popover.Content>
        └── <Popover.Arrow />     (optional)
        children
      </Popover.Content>
</Popover>
```

## Required behaviors
- Trigger click toggles open. Escape closes. Outside click closes.
- Focus moves into popover on open; returns to trigger on close.
- ARIA: trigger gets `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`. Content has `role="dialog"`.
- Optional arrow follows the trigger via Floating UI's `arrow` middleware.

## Visual states
`open` (animated in) · `closed`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `open`, `defaultOpen`, `onOpenChange` | — | — | no | Standard open-state shape. |
| `placement` | Floating UI placement | `'bottom'` | no | Position relative to trigger. |
| `offset` | `number` | `8` | no | Distance from trigger. |
| `dismissOnOutsideClick` | `boolean` | `true` | no | Click-outside closes. |
| `dismissOnEscape` | `boolean` | `true` | no | Escape closes. |

## Composition
Compound. Internal open state. Same-domain reuse with `Backdrop` is not needed — Popover doesn't dim the page.

## Accessibility
- WAI-ARIA Dialog (modal=false) pattern.
- Focus trap inside the popover while open.

## Known limitations
- No animation customization (uses `animate-in fade-in-0 zoom-in-95`).
- Arrow positioning hooks into Floating UI middleware; arrow color must match popover background.

## Inspirations
- Radix `Popover`.
- shadcn/ui `Popover`.
