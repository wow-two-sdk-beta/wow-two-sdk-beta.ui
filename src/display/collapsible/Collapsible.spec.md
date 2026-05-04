# Collapsible

## Purpose
Single show/hide region — a trigger that toggles a panel. The state-managed counterpart to L4 `DisclosureButton` (which is the trigger only). Use for FAQ entries, expandable rows, settings drawers, "show more" patterns.

(WAI-ARIA pattern: this is the "Disclosure" pattern. We name it `Collapsible` to match Radix / shadcn / Mantine conventions; React Aria calls the same primitive `Disclosure`.)

## Anatomy
```
<Collapsible>
  ├── <Collapsible.Trigger asChild?>
  └── <Collapsible.Content>
</Collapsible>
```

## Required behaviors
- Trigger click toggles open. Enter/Space activate.
- Content is removed from the DOM when closed (no display:none — actually unmounted) so focus can't land in hidden content.
- Trigger gets `aria-expanded` and `aria-controls`. Content gets `id` for the controls reference.
- Smooth height transition (CSS only).

## Visual states
`open` · `closed`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `open`, `defaultOpen`, `onOpenChange` | — | — | no | Standard. |
| `disabled` | `boolean` | `false` | no | Block toggling. |

## Composition
Compound. State on root; trigger and content read from context.

## Accessibility
- WAI-ARIA Disclosure pattern.
- Content element is referenced by trigger via `aria-controls` / `id`.

## Known limitations
- No animation orchestration (relies on consumer's CSS transitions).
- No "always render hidden" mode (deferred — may need `forceMount` later).

## Inspirations
- Radix `Collapsible`.
- React Aria `Disclosure`.
- shadcn/ui `Collapsible`.
