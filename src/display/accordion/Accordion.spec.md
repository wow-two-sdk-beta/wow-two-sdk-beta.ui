# Accordion

## Purpose
Vertical list of `Collapsible`-style items where one (or multiple) can be open at a time. Use for FAQs, settings groups, navigation menus with collapsible sections.

## Anatomy
```
<Accordion type="single" | "multiple">
  ├── <Accordion.Item value>
  │     ├── <Accordion.Trigger>
  │     └── <Accordion.Content>
  │   </Accordion.Item>
  └── ...more items
</Accordion>
```

## Required behaviors
- `type="single"` — one item open at a time. Optional `collapsible` allows closing the active item.
- `type="multiple"` — any number of items open simultaneously.
- Trigger toggles its item. Up/Down arrows move focus between triggers (roving). Home/End jump.
- Each trigger is a real button (DOM focus), not active-descendant.
- ARIA: trigger has `aria-expanded` + `aria-controls`. Content has `id` + `role="region"`.

## Visual states (per trigger)
`open` · `closed` · `hover` · `focus-visible` · `disabled`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `type` | `'single' \| 'multiple'` | `'single'` | no | Selection mode. |
| `value` | `string \| string[]` | — | no | Controlled (string for single, array for multiple). |
| `defaultValue` | same | — | no | Uncontrolled. |
| `onValueChange` | `(v) => void` | — | no | Selection callback. |
| `collapsible` | `boolean` | `false` | no | Single mode only — allow closing the active item. |
| `disabled` | `boolean` | `false` | no | Block all triggers. |

`Accordion.Item`: `value` (req), `disabled?`. `Accordion.Trigger` and `Accordion.Content`: same shape as `Collapsible` siblings, scoped to the parent item.

## Composition
Compound. Accordion root tracks active values; items participate via context. Same-domain pattern echoes `Collapsible` but adds the group-level state machine (single/multiple/collapsible).

## Accessibility
- WAI-ARIA Accordion pattern.
- Roving focus across triggers via the existing `RovingFocusGroup` primitive.

## Known limitations
- No drag-to-reorder.
- No nested accordions support beyond plain composition.

## Inspirations
- Radix `Accordion`.
- shadcn/ui `Accordion`.
