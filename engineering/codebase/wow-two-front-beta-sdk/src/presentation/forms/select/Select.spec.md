# Select

> **Behavioral contract:** [`Select.standard.md`](./Select.standard.md)

Single-select dropdown — a button trigger that opens a floating `role="listbox"`. Generic over `<K, V>`: `K` is the selection key (drives equality, serialization, ARIA), `V` is the rich payload returned to the consumer (defaults to `K`). Use when the option set is enumerable and small-to-medium and no free-text entry is needed; for type-against-a-large-set or user-supplied values use `Combobox`; for multi-pick use a future `MultiSelect`.

## Anatomy

```
<Select value defaultValue onValueChange …>          (root — owns state via context)
  <Select.Trigger size state>                          (native <button>)
    <Select.Value placeholder />                        (collapsed selected label)
    └── chevron · clear(×) sibling button (isClearable) (rendered by Trigger)
  <Select.Content isSearchable matchWidth …>           (floating PopoverContent)
    ├── SearchInput            (isSearchable only — combobox, bridges keys)
    └── <Listbox id=listboxId> (role="listbox")
         ├── <Select.Group label?>                      (role="group")
         │     └── <Select.Item itemKey value label …>  (role="option" = Listbox.Item)
         ├── <Select.Separator />                        (role="separator")
         └── <Select.Empty />                            (no-match message)
  └── hidden <input name> (when `name` set — outside popover)
```

## Style axes

The trigger's appearance is the cross of two axes; both derive from the shared `inputBaseVariants` (via `tv` `extend`) so they never drift from `TextInput`.

### `size` — height + padding + font

| Value | Height | Padding | Font | Gap |
|---|---|---|---|---|
| `xs` | `h-7` (28px) | `px-2` | `text-xs` | `gap-1.5` |
| `sm` | `h-8` (32px) | `px-2.5` | `text-sm` | `gap-2` |
| `md` (default) | `h-10` (40px) | `px-3` | `text-sm` | `gap-2` |
| `lg` | `h-12` (48px) | `px-4` | `text-base` | `gap-2` |

### `state` — border + ring

| Value | Visual |
|---|---|
| `default` | `border-input`, `hover:border-border-strong`, open → `border-border-strong` |
| `invalid` | `border-destructive`, `focus-visible:ring-destructive`, `aria-invalid` |

`state` is resolved automatically: an explicit `Select.Trigger state` wins; otherwise `isInvalid` (prop or inherited from `FormField`) maps to `state='invalid'`, else `default`.

## Sizing & spacing

- Chevron / clear glyph scale with size: `xs h-3` · `sm h-3.5` · `md h-4` · `lg h-5`.
- Clear (×) hit target is floored at `min-h-6 min-w-6` (24×24, WCAG 2.2 SC 2.5.8); the glyph stays at the size above.
- `Select.Content` width: default `w-auto min-w-(--anchor-width)`; with `matchWidth` it locks to `w-(--anchor-width)` and truncates long item labels.

## Content

- `Select.Value` renders the collapsed label. Resolution order: explicit `children` → live registry match → label captured at selection → `getOptionLabel(key)` → `serializeKey(key)`. `placeholder` shows when nothing is selected.
- `Select.Item` `label` is what the trigger shows; `children` overrides in-list rendering (e.g. label + count); `text` overrides the searchable text (defaults to the extracted text of `label`).
- Long labels truncate (`truncate`) inside the trigger; in-list truncation only under `matchWidth`.

## States

| State | Visual change | Behavioral change | `data-state` (trigger) |
|---|---|---|---|
| `default` | `border-input` | interactive | *(absent)* |
| `hover` | `border-border-strong` | — | *(absent)* |
| `focus-visible` | `ring-2 ring-ring` | — | *(absent)* |
| `open` | border-strong, chevron rotated 180° | listbox shown, dismissable | `open` |
| `invalid` | `border-destructive`, error ring, `aria-invalid` | — | `invalid` |
| `loading` (`isLoading`) | spinner replaces chevron, `aria-busy` | interaction blocked | `loading` |
| `disabled` | `opacity-60`, `cursor-not-allowed` | not focusable, no open | `disabled` |

`data-state` resolution order: `open` → `loading` → `disabled` → `invalid` → absent.

## Behavior

- **Open/close:** click / Enter / Space toggles; outside pointer-down + Escape close; focus returns to the trigger on close.
- **Keyboard (non-searchable):** focus rests on the listbox; ArrowUp/Down move active, Home/End + PageUp/Down jump, Enter/Space select, disabled options skipped. Active option initialises to the selected option (or first enabled).
- **Keyboard (searchable):** focus rests on the `SearchInput` (a `role="combobox"`); ArrowUp/Down/Home/End/PageUp/Down/Enter are forwarded to the listbox handler and `aria-activedescendant` is mirrored onto the input; printable chars filter; Escape closes + restores trigger focus.
- **Type-to-select (typeahead):** powered by the shared `useTypeahead` hook (`src/hooks/`). **Closed trigger** — typing a printable char selects the matching option *without* opening (native `<select>` behaviour). **Open + non-searchable** — the focused listbox's own typeahead moves the active option. Prefix-match the buffer (case-insensitive); a single repeated char cycles to the next match after the active/selected one; disabled options are skipped; the buffer resets after ~500ms idle. Disabled in **searchable** mode (the filter owns typing there).
- **Form association:** with `name`, a hidden `<input>` (outside the popover) ships `serializeKey(key)`; survives submission while closed.
- **Loading:** `isLoading` shows a spinner, sets `aria-busy`, blocks interaction without dropping the trigger from the focus order.

## Accessibility

- Trigger: `role` native button · `aria-haspopup="listbox"` · `aria-expanded` · `aria-controls={listboxId}` · `aria-activedescendant` while open · `aria-invalid` when invalid.
- Name: `aria-labelledby` → FormField label when wrapped; else consumer `aria-label` (explicit `aria-label` always wins).
- Description: `aria-describedby` → `${helperId} ${errorId}` inherited from `FormControlProvider`.
- Listbox: `role="listbox"` with `id={listboxId}`; options are `Listbox.Item` (`role="option"`, `aria-selected`, `aria-disabled`).
- Clear button: `aria-label={clearLabel}`, ≥24×24 target, `focus-visible` ring.

## Composition

```tsx
// Inside a FormField — id/aria/invalid/describedby auto-wired.
<FormField label="Plan" error={err}>
  <Select<string> value={k} onValueChange={(o) => setK(o?.itemKey ?? null)}>
    <Select.Trigger><Select.Value placeholder="Select…" /></Select.Trigger>
    <Select.Content>
      <Select.Item itemKey="free" label="Free" />
      <Select.Item itemKey="pro" label="Pro" isDisabled />
    </Select.Content>
  </Select>
</FormField>

// K/V split: K = number (id), V = User (payload).
<Select<number, User> value={id} onValueChange={setPick} isClearable>
  <Select.Trigger><Select.Value placeholder="Pick a user…" /></Select.Trigger>
  <Select.Content isSearchable>
    {users.map((u) => (
      <Select.Item<number, User> key={u.id} itemKey={u.id} value={u} label={u.name} text={`${u.name} ${u.email}`}>
        <div className="flex flex-col"><span>{u.name}</span><span className="text-xs">{u.email}</span></div>
      </Select.Item>
    ))}
  </Select.Content>
</Select>
```

## Props summary

### `Select` (root)

| Name | Type | Default | Notes |
|---|---|---|---|
| `value` | `K \| null` | — | Controlled key; `null` = explicit clear, `undefined` = uncontrolled. |
| `defaultValue` | `K \| null` | `null` | Uncontrolled initial key. |
| `onValueChange` | `(o: SelectOption<K,V> \| null) => void` | — | Fires on pick (`option`) and clear (`null`). |
| `keyEquals` | `EqualityComparer<K>` | `Equality.strictEquals` | Key equality for selection / dedup. |
| `isDisabled` | `boolean` | `false` (or FormField) | Blocks interaction; inherits from `FormField`. |
| `isLoading` | `boolean` | `false` | Spinner + `aria-busy`; blocks interaction. |
| `isClearable` | `boolean` | `false` | Renders the clear (×) sibling button when a value is set. |
| `clearLabel` | `string` | `'Clear selection'` | `aria-label` of the clear button (i18n). |
| `name` | `string` | — | Emits a hidden `<input name>` with the serialized key. |
| `serializeKey` | `(k: K) => string` | `String(k)` | Serializes the key for the hidden input. |
| `getOptionLabel` | `(k: K) => ReactNode` | — | Resolves a label for a controlled/default value before items register. |
| `isInvalid` | `boolean` | `false` (or FormField) | `state='invalid'` + `aria-invalid`; inherits from `FormField`. |
| `open` / `defaultOpen` | `boolean` | `false` | Controlled / initial open state. |
| `onOpenChange` | `(open: boolean) => void` | — | Open-state callback. |
| `placement` | `Popover['placement']` | `'bottom'` | Floating placement of the popup. |

### `Select.Trigger` — `Omit<ButtonHTMLAttributes, 'children'>` +

| Name | Type | Default | Notes |
|---|---|---|---|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Trigger size axis. |
| `state` | `'default' \| 'invalid'` | auto | Override the auto-resolved state. |
| `children` | `ReactNode` | `<Select.Value />` | Custom trigger content. |

### `Select.Value`

| Name | Type | Default | Notes |
|---|---|---|---|
| `placeholder` | `ReactNode` | — | Shown when no selection. |
| `children` | `ReactNode` | — | Overrides the auto-resolved label verbatim. |

### `Select.Content` — `SurfaceVariants` +

| Name | Type | Default | Notes |
|---|---|---|---|
| `isSearchable` | `boolean` | `false` | Adds the filter input (keyboard-bridged combobox). |
| `searchPlaceholder` | `string` | `'Search…'` | Search input placeholder (i18n). |
| `noResultsLabel` | `ReactNode` | `'No results'` | Shown when the filter empties the list (i18n). |
| `matchWidth` | `boolean` | `false` | Locks width to the trigger and truncates items. |
| `variant`/`tone`/`radius`/`padding`/`elevation` | `SurfaceVariants` | `padding='none'` | Popover surface chrome. |

### `Select.Item` (generic `<K, V>`)

| Name | Type | Default | Notes |
|---|---|---|---|
| `itemKey` | `K` | — | Identity — equality, ARIA, search. |
| `value` | `V` | `itemKey` | Rich payload returned via `onValueChange`. |
| `label` | `ReactNode` | — | Shown in the trigger when selected. |
| `children` | `ReactNode` | `label` | In-list rendering override. |
| `text` | `string` | text of `label` | Searchable-text override. |
| `isDisabled` | `boolean` | `false` | Skipped by keyboard nav; no-op on click. |

`Select.Group` · `Select.Separator` · `Select.Empty` re-export the `Listbox` equivalents.

## Storybook coverage

`Default` · `Grouped` · `Clearable` · `MetaInItem` · `Searchable` · `TypeToSelect` (closed-trigger typeahead) · `Loading` · `KvSplit` · `InFormField` (proves FormField aria wiring) · `DisabledOption` (active-skip) · `Invalid` · `InvalidWithError` (FormField error text) · `SizeMatrix` (xs/sm/md/lg) · `ControlledOpen` (`open`/`onOpenChange`) · `Disabled` · `Playground` (controls-driven).

## Non-goals

- **`options` / `renderItem` data API** — declarative children only for now; an array-driven API is deferred.
- **Async / virtualized lists** — out of scope; large/remote sets belong to `Combobox`.
- **Multi-select** — single-value only; multi-pick belongs to a future `MultiSelect`.
- **Family value-type unification** — the `<K, V>` split is per-component; harmonising value-typing across form atoms is deferred.

## Inspirations

- Radix `Select` — compound API, `data-state`, listbox semantics.
- shadcn/ui `Select` — trigger/content/item slot shape.
- Mantine `Select` — label registry + `searchable` filter.
- React Aria `Select` / `ListBox` — `aria-activedescendant` + active-skip keyboard model.

---

*Inline citations point at specific rule URLs. See [`Select.standard.md`](./Select.standard.md) `Related` for broad references.*
