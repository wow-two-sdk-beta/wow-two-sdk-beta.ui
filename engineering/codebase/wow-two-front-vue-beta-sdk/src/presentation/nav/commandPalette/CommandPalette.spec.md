# CommandPalette

## Purpose
Cmd/Ctrl-K-style searchable action menu. A modal dialog containing a combobox-shaped input + filtered list of actions, grouped optionally.

## Anatomy
```
<CommandPalette open onOpenChange triggerKey="k">
  <CommandPalette.Content>
    <CommandPalette.Input placeholder="Type a command…" />
    <CommandPalette.List>
      <CommandPalette.Group label="Actions">
        <CommandPalette.Item value="new-doc" onSelect>New document</CommandPalette.Item>
        ...
      </CommandPalette.Group>
      <CommandPalette.Empty>No matches.</CommandPalette.Empty>
    </CommandPalette.List>
  </CommandPalette.Content>
</CommandPalette>
```

## Required behaviors
- Optional `triggerKey` (e.g. `'k'`) → meta/ctrl-K opens globally.
- Mounts inside a `Dialog` — Esc closes, click-outside closes, focus is trapped.
- Input → filters items by matching `searchValue` against item children (string-only) or a custom `filter` function.
- ↑ / ↓ moves active item; Enter selects (calls `onSelect`, closes by default).
- Selecting an item closes the palette unless `closeOnSelect={false}` per item.
- Type-to-filter is uncontrolled by default; consumers may control via `inputValue` + `onInputChange`.

## Visual states
`closed` · `open` · `empty (no matches)` · `disabled item`

## Props (root)
| Name | Type | Default | Why |
|---|---|---|---|
| `open` / `defaultOpen` / `onOpenChange` | controlled state | uncontrolled by default | |
| `inputValue` / `defaultInputValue` / `onInputChange` | controlled search | uncontrolled by default | |
| `triggerKey` | `string` | — | Single character; `meta+key` (cmd-K) or `ctrl+key` opens. |
| `filter` | `(item, search) => boolean` | substring match against string children | |
| `placeholder` | `string` | `'Type a command…'` | |

## Composition model
Compound. Composes `overlays/Dialog` (root + content) + a Combobox-flavored input/list (built inline — we don't compose `Combobox` because Combobox lives in `forms/` and is shaped around a single value, while CommandPalette emits actions). Items register through context, similar to `Listbox.Item`. Active-descendant focus model — DOM focus stays on input.

## Accessibility
- Dialog: `aria-labelledby` (input) + `aria-modal`.
- Input: `role="combobox"` + `aria-expanded="true"` (always while palette is open) + `aria-controls={listId}` + `aria-activedescendant={activeId}`.
- List: `role="listbox"`. Items: `role="option"` + `aria-selected` (active), `aria-disabled` if disabled.
- Group: `role="group"` + `aria-labelledby`.
- Trigger key: `meta+key` always wins on macOS, `ctrl+key` elsewhere — we accept both.

## Dependencies
Foundation: `utils`, `hooks/useId`, `hooks/useControlled`, `icons`. Cross-domain: `overlays/Dialog`. Reuses `forms/listbox`'s `listbox*Variants` (cross-domain; same patterns as `Combobox` does).

## Inspirations
cmdk (Pacocoursey), Raycast, Linear's command bar. Ours: smaller surface — no nested pages, no async loaders, no scoring; consumers drive grouping and ordering directly.
