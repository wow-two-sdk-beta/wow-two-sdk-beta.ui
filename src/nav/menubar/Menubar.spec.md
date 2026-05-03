# Menubar

## Purpose
Horizontal menu strip — File · Edit · View pattern from desktop apps. Only one submenu open at a time; hovering a sibling trigger while another is open switches focus + open state.

## Anatomy
```
<Menubar>
  ├── <Menubar.Menu>
  │     ├── <Menubar.Trigger>
  │     └── <Menubar.Content>
  │           ├── <Menubar.Item onSelect>
  │           ├── <Menubar.Group label?>
  │           ├── <Menubar.Label>
  │           └── <Menubar.Separator />
  │         </Menubar.Content>
  │   </Menubar.Menu>
  └── ...more <Menubar.Menu>
</Menubar>
```

## Required behaviors
- Click trigger toggles its menu; opens close all siblings.
- Hovering a sibling trigger while another menu is open switches active menu (mouse follow).
- ←/→ on focused trigger moves focus across triggers (roving).
- ↓/Enter/Space opens the trigger's menu and focuses first item.
- Inside an open menu: same shortcuts as `Menu`. Escape closes and returns focus to its trigger.
- ARIA: container `role="menubar"`, triggers `role="menuitem"` with `aria-haspopup="menu"` + `aria-expanded`.

## Props
- `Menubar`: `defaultValue?` / `value?` / `onValueChange?` — controlled active-menu id.
- `Menubar.Menu`: `value` (req — the id of this menu).
- `Menubar.Trigger`, `Menubar.Content`: same shape as `DropdownMenu` siblings.
- Items / Groups / Separators: same as `Menu`.

## Composition
Compound. Tracks active menu id at root level; each `Menubar.Menu` participates via context.

## Accessibility
- WAI-ARIA Menubar pattern.
- Focus return on close.

## Known limitations
- No ←/→ traversal *from inside* an open menu (deferred to P6 with submenu work).
- No type-to-search.

## Inspirations
- Radix `Menubar`.
- shadcn/ui `Menubar`.
- Native macOS / Windows menubars.
