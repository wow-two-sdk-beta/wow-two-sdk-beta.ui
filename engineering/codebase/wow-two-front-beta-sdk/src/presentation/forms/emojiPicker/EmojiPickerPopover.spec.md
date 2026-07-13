# EmojiPickerPopover

## Purpose
Popover-hosted variant of `EmojiPicker` — a chat/toolbar-friendly affordance. A trigger opens an SDK `Popover` holding the full `EmojiPicker`; picking emits the `EmojiCatalogEntry` via `onChange` (chat reads `entry.glyph`) and closes the popover. No size inside: compose `EmojiSizeControl` separately when a host needs a per-emoji scale.

## Anatomy
```
<EmojiPickerPopover>
  └── <Popover>                          (overlays/popover)
        ├── <PopoverTrigger asChild>     (default: emoji-icon <Button>, or custom `trigger`/`children`)
        └── <PopoverContent>
              └── <EmojiPicker>          (forms/emojiPicker — glyph API)
```

## Required behaviors
- The default trigger is an icon-only `Button` showing the current glyph (or 🙂 when unset), labelled "Choose emoji"; a custom `trigger` (or `children`) replaces it.
- Clicking the trigger toggles the popover; it dismisses on outside-click / Escape (inherited from `Popover`).
- Picking an emoji forwards the `EmojiCatalogEntry` through `onChange` and closes the popover; clearing (**None** → `null`) forwards `null` and leaves the popover open.
- Open state is controllable (`open` / `defaultOpen` / `onOpenChange`) and otherwise self-managed.
- Every non-`value`/`onChange` `EmojiPicker` prop (`storage`, `categoryNavVariant`, `size`, `tileShape`, `rowsCount`) passes straight through.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `EmojiCatalogEntry \| null` | — | yes | The controlled selection; `null` = none. |
| `onChange` | `(entry: EmojiCatalogEntry \| null) => void` | — | yes | Fires on pick and clear; a non-null pick also closes the popover. |
| `storage` | `StorageBroker` | — | yes | Persistence seam for recents, forwarded to `EmojiPicker`. |
| `trigger` / `children` | `ReactNode` | emoji-icon `Button` | no | A custom trigger element. |
| `placement` | `PopoverProps['placement']` | `bottom` | no | Popover placement relative to the trigger. |
| `open` / `defaultOpen` / `onOpenChange` | — | — | no | Controlled / uncontrolled open-state passthrough. |
| `categoryNavVariant` · `size` · `tileShape` · `rowsCount` | — | — | no | Forwarded to the hosted `EmojiPicker`. |

## Composition
- Cross-group: `presentation/overlays` (`Popover`, `PopoverTrigger`, `PopoverContent`), `presentation/actions` (`Button`), `foundation/hooks` (`useControlled`).
- Wraps `forms/emojiPicker/EmojiPicker` — inherits its catalog, search, recents, nav, and roving-grid behavior.

## Accessibility
- Trigger carries `aria-haspopup="dialog"` + `aria-expanded` (from `PopoverTrigger`); the panel is a focus-trapped `role="dialog"`.

## Known limitations
- Glyph-only — no size control inside the popover (compose `EmojiSizeControl` in the host surface).
