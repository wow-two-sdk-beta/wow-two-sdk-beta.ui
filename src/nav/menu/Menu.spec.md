# Menu

## Purpose
Raw floating menu primitive — bring-your-own-anchor and bring-your-own-open-state. Use directly when you need full control; otherwise use `DropdownMenu` (button-triggered), `ContextMenu` (right-click), or `Menubar` (horizontal menu strip), which all wrap `Menu`.

## Anatomy
```
<Menu>                          (parent owns open + anchor)
  ├── <Menu.Item onSelect>
  ├── <Menu.Group label?>
  ├── <Menu.Label>
  └── <Menu.Separator />
</Menu>
```

## Required behaviors
- ↑/↓ moves focus through items. Home/End jump. Disabled items are skipped.
- Enter/Space invokes `onSelect` and closes the menu (consumer's `onClose` fires).
- Escape closes. Outside pointerdown closes. Tab closes (matches OS menus).
- Items are real `<button>`s — focus moves DOM-side (NOT active-descendant — different a11y pattern from `Listbox`).
- ARIA: container `role="menu"`, items `role="menuitem"`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `open` | `boolean` | — | yes | Controlled — parent owns. |
| `anchor` | `HTMLElement \| null` | — | yes | Element to position next to. |
| `onClose` | `() => void` | — | yes | Fires on Escape, outside click, item select. |
| `placement` | Floating UI placement | `'bottom-start'` | no | Position relative to anchor. |
| `offset` | `number` | `6` | no | Distance from anchor. |
| `aria-label` | `string` | — | recommended | A11y label for the menu. |

`Menu.Item`: `onSelect?`, `disabled?`, `children`, all native button props.

## Composition
Compound with parent-owned state. `DropdownMenu` / `ContextMenu` / `Menubar` wrap `Menu` with their own open-state machinery.

## Accessibility
- WAI-ARIA Menu pattern.
- Focus trap inside while open; Tab/Escape closes.
- Items are real buttons → screen-reader-friendly out of the box.

## Known limitations
- No submenus (deferred to P6).
- No checkbox/radio menu items (deferred — add as `Menu.CheckboxItem` / `Menu.RadioItem` later).
- No type-to-search.

## Inspirations
- Radix `Menu` (parent-owned-state shape).
- React Aria `Menu`.
- shadcn/ui `DropdownMenu` (visual reference).
