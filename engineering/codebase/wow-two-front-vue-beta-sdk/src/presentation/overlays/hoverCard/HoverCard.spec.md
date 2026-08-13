# HoverCard

## Purpose
Hover- and focus-triggered floating panel — richer than `Tooltip`, less interruptive than `Popover`. Use for inline previews (user mentions, link previews, data hovers).

## Anatomy
```
<HoverCard>
  ├── <HoverCard.Trigger asChild?>
  └── <HoverCard.Content>
        └── <HoverCard.Arrow />     (optional)
        children
      </HoverCard.Content>
</HoverCard>
```

## Required behaviors
- Pointer enter/focus on trigger opens after `openDelay`. Pointer leave / blur closes after `closeDelay`.
- Pointer over the content keeps it open (the close timer cancels when entering content).
- Does NOT trap focus (would interrupt page flow).
- ARIA: trigger is unchanged; content has no special role (it's a presentation surface, not a dialog).

## Visual states
`open` (animated in) · `closed`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `open`, `defaultOpen`, `onOpenChange` | — | — | no | Standard. |
| `openDelay` | `number` (ms) | `700` | no | Standard hover-card delay. |
| `closeDelay` | `number` (ms) | `300` | no | Lets users move pointer to content. |
| `placement` | Floating UI placement | `'bottom'` | no | Position. |
| `offset` | `number` | `8` | no | Distance from trigger. |

## Composition
Compound. Content is portaled and anchored. Same-domain reuse with `Popover.Arrow` style is not used (we re-derive the arrow inline) since cross-component imports inside the same domain would still work but we keep the panel visual separate to evolve independently.

## Accessibility
- Hover-only behavior is enhanced by focus support — tab onto the trigger to open.
- Touch devices: tap trigger to open (handled via focus event on tap).

## Known limitations
- No focus trap — intentional. If you need trapped focus, use `Popover` instead.
- Single child trigger — array/string children render as-is without HoverCard.

## Inspirations
- Radix `HoverCard`.
- shadcn/ui `HoverCard`.
