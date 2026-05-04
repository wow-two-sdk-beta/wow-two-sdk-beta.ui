# Toolbar

## Purpose
Container for grouped action controls — buttons, separators, links — sharing a single tab stop with arrow-key navigation between items. Use for editor toolbars, action bars, formatting controls.

## Anatomy
```
<Toolbar>
  ├── <Toolbar.Button> (or <Toolbar.Link>)
  ├── <Toolbar.Separator />
  └── ...more items
</Toolbar>
```

## Required behaviors
- Single tab stop. Arrow keys (←/→ horizontal, ↑/↓ vertical) move focus across items (roving).
- Home/End jump to first/last item.
- ARIA: container = `role="toolbar"`.

## Visual states (per item)
Same as `actions/button`'s focus/hover/disabled states.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | no | Layout + arrow-key axis. |
| `aria-label` | `string` | — | recommended | A11y label for the toolbar. |

`Toolbar.Button` / `Toolbar.Link`: standard button/anchor props plus auto-roving-focus participation.

## Composition
Compound. Same-domain reuse: caller can compose existing `actions/Button`, `IconButton`, `ToggleButton` inside `Toolbar.Button asChild`.

## Accessibility
- WAI-ARIA Toolbar pattern.

## Known limitations
- No nested groups (e.g., toggle-group within toolbar) with shared roving — item types are flat. Defer to P6 if a real consumer needs it.

## Inspirations
- Radix `Toolbar`.
- React Aria `Toolbar`.
