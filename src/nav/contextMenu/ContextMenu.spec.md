# ContextMenu

## Purpose
Right-click menu — wraps a target area; opens at the pointer position. Same item shape as `Menu` / `DropdownMenu`.

## Anatomy
```
<ContextMenu>
  ├── <ContextMenu.Trigger asChild?>
  └── <ContextMenu.Content>
        ├── <ContextMenu.Item onSelect>
        ├── <ContextMenu.Group label?>
        ├── <ContextMenu.Label>
        └── <ContextMenu.Separator />
      </ContextMenu.Content>
</ContextMenu>
```

## Required behaviors
- `contextmenu` event on the trigger area opens the menu at pointer position (suppresses native menu).
- Long-press on touch devices opens the menu.
- Inside menu: same shortcuts as `Menu`. Outside click / Escape closes.
- ARIA: container `role="menu"`, items `role="menuitem"`.

## Props
- `ContextMenu.Trigger`: `asChild` allowed; default renders a `<div>` wrapper.
- Items / Groups / Separators: same shape as `Menu`.

## Composition
Wraps `Menu`. Anchor is a virtual element at the pointer coordinates.

## Accessibility
- Activatable via Shift+F10 / context-menu key while focused on trigger.
- Focus returns to whatever was focused before opening.

## Known limitations
- No submenus (P6).
- Touch long-press uses a 600ms timer — not configurable yet.

## Inspirations
- Radix `ContextMenu`.
- shadcn/ui `ContextMenu`.
