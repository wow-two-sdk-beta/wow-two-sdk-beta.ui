# DropdownMenu

## Purpose
Button-triggered menu — most common menu shape. Click the trigger to open; pick an item; menu closes. Same internals as `Menu`, plus owned open state and trigger.

## Anatomy
```
<DropdownMenu>
  ├── <DropdownMenu.Trigger asChild?>
  └── <DropdownMenu.Content>
        ├── <DropdownMenu.Item onSelect>
        ├── <DropdownMenu.Group label?>
        ├── <DropdownMenu.Label>
        └── <DropdownMenu.Separator />
      </DropdownMenu.Content>
</DropdownMenu>
```

## Required behaviors
- Trigger click toggles open. Enter/Space on focused trigger opens.
- ↓ on trigger opens + focuses first item. ↑ opens + focuses last.
- Inside menu: arrow keys, Enter/Space, Escape, outside click — same as `Menu`.
- Selecting an item closes the menu and returns focus to the trigger.
- ARIA: trigger gets `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`.

## Props (Root)
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `open`, `defaultOpen`, `onOpenChange` | — | — | no | Standard open-state shape. |
| `placement` | Floating UI placement | `'bottom-start'` | no | Pass-through to `Menu`. |

`DropdownMenu.Trigger`: `asChild` to use a custom button (e.g., `<Button>` or `<IconButton>`). Default renders a plain button.
`DropdownMenu.Item`: same shape as `Menu.Item`.

## Composition
Compound with internal open state. Wraps `Menu` for content rendering; same-domain reuse.

## Accessibility
- WAI-ARIA Menu Button pattern.
- Focus return to trigger after selection / Escape.

## Known limitations
- No submenus (P6).
- No checkbox/radio items (P6 — promote `Menu.CheckboxItem` then alias).

## Inspirations
- Radix `DropdownMenu`.
- shadcn/ui `DropdownMenu`.
