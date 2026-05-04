# Tabs

## Purpose
Switch between content panels via a row of tabs. Each tab is associated with a panel; only the active panel renders.

## Anatomy
```
<Tabs>
  ├── <Tabs.List>
  │     ├── <Tabs.Tab value>
  │     └── ...more
  │   </Tabs.List>
  └── <Tabs.Panel value> (one per Tab)
</Tabs>
```

## Required behaviors
- Click a tab to activate. Arrow keys (←/→ horizontal, ↑/↓ vertical) move focus across tabs (roving). Home/End jump.
- `activationMode="automatic"` (default): focused tab activates immediately.
- `activationMode="manual"`: focus moves but selection requires Enter/Space.
- ARIA: container has no role; `Tabs.List` = `role="tablist"`; `Tabs.Tab` = `role="tab"` with `aria-selected` + `aria-controls`; `Tabs.Panel` = `role="tabpanel"` + `aria-labelledby`.

## Visual states (per tab)
`default` · `hover` · `focus-visible` · `active` (selected) · `disabled`

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `string` | — | no | Controlled active tab. |
| `defaultValue` | `string` | — | no | Uncontrolled. |
| `onValueChange` | `(v) => void` | — | no | Selection callback. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | no | Layout + arrow-key axis. |
| `activationMode` | `'automatic' \| 'manual'` | `'automatic'` | no | Whether arrow-key focus auto-activates. |

`Tabs.Tab`: `value` (req), `disabled?`. `Tabs.Panel`: `value` (req).

## Composition
Compound with shared root context.

## Accessibility
- WAI-ARIA Tabs pattern.
- Tab + panel id pairing for screen readers.

## Known limitations
- No drag-to-reorder.
- No close-button per tab (browser-tab style — future).

## Inspirations
- Radix `Tabs`.
- shadcn/ui `Tabs`.
- React Aria `Tabs`.
