# NavigationMenu

## Purpose
Top-level site/app navigation with optional rich content panels per item — the "mega menu" pattern. Use for product nav, marketing site headers, app-wide section selectors.

## Anatomy
```
<NavigationMenu>
  └── <NavigationMenu.List>
        ├── <NavigationMenu.Item>
        │     ├── <NavigationMenu.Trigger>     (opens content panel)
        │     └── <NavigationMenu.Content>     (rich panel below)
        │   </NavigationMenu.Item>
        └── <NavigationMenu.Item>
              └── <NavigationMenu.Link href>   (no content panel)
            </NavigationMenu.Item>
      </NavigationMenu.List>
</NavigationMenu>
```

## Required behaviors
- Click trigger toggles its content panel. Hovering a sibling trigger while another panel is open switches active.
- ←/→ on focused trigger moves focus across triggers (roving).
- Escape closes the active panel.
- Click outside the menu closes the active panel.
- ARIA: container `role="navigation"`; list items have triggers with `aria-expanded` + `aria-controls`; content panel has `id` referenced by the trigger.

## Visual states (per item)
`default` · `hover` · `focus-visible` · `open` (active trigger)

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `string \| null` | — | no | Controlled active item id. |
| `defaultValue` | `string \| null` | `null` | no | Uncontrolled. |
| `onValueChange` | `(v) => void` | — | no | Callback. |
| `aria-label` | `string` | `'Main navigation'` | no | A11y label. |

`NavigationMenu.Item`: `value` (req — used as id when wrapped with Trigger).
`NavigationMenu.Trigger`: standard button.
`NavigationMenu.Content`: rich panel.
`NavigationMenu.Link`: anchor for non-popover items.

## Composition
Compound. State on root tracks active item. Same-domain pattern echoes `Menubar` but with content panels (not nested menus) and link-only items mixed with trigger items.

## Accessibility
- WAI-ARIA Disclosure pattern per item (the spec doesn't have a dedicated NavigationMenu role; we use `role="navigation"` on the container).

## Known limitations
- No hover-delay state machine (Radix has one). Click-based for batch 5; defer hover behavior to P6.
- Content panels render below the trigger via `AnchoredPositioner`. No "viewport" pattern (Radix has a single shared content viewport that animates between item contents).

## Inspirations
- Radix `NavigationMenu`.
- shadcn/ui `NavigationMenu`.
