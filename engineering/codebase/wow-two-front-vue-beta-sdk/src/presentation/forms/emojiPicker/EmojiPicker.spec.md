# EmojiPicker

## Purpose
Emoji picker over the full bundled emoji catalog (`domain/emoji`, ~1870 base emoji): search + a "recently used" bucket + a swappable category nav. Fully controlled — emits the picked `EmojiCatalogEntry` (the full `{ glyph, label, tags, category }` record) or `null` for none. Size is a separate concern (`EmojiSizeControl`), and a popover-hosted variant lives in `EmojiPickerPopover`. Storage-agnostic: recents persist through an injected `StorageBroker`, so the component itself touches no `localStorage`.

## Anatomy
```
<EmojiPicker>
  ├── header: "Emoji" + None button (clears to null)
  ├── <SearchInput>                      (forms/searchInput)
  ├── <CategoryNav>                      (strip | pills — hidden while searching)
  │     └── <ToggleButtonGroup>          (actions/toggleButtonGroup)
  └── <EmojiGrid>                        (roving listbox of <EmojiTile>)
</EmojiPicker>
```

## Required behaviors
- Search filters the whole catalog by label + tags (label matches rank above tag-only); a blank keyword returns to category browsing.
- The category nav jumps between the synthetic **Recent** bucket and the eight catalog categories; it is hidden while a search is active.
- Recents are a most-recently-used list (deduped by glyph, capped at 24) persisted through the injected `storage` broker.
- Clicking an emoji emits its `EmojiCatalogEntry` and records it as recent.
- **None** clears the selection to `null`.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `value` | `EmojiCatalogEntry \| null` | — | yes | Controlled selection; `null` = none. |
| `onChange` | `(entry: EmojiCatalogEntry \| null) => void` | — | yes | Fires on pick and clear. |
| `storage` | `StorageBroker` | — | yes | Persistence seam for recents. Plug `localStorageStorageBroker`, `memoryStorageBroker()`, or a custom broker. |
| `categoryNavVariant` | `CategoryNavVariant` | `strip` | no | Segmented icon strip vs labelled pills. |
| `size` | `EmojiPickerSizeInput` | `md` | no | One scale for all elements, or a per-element `{ search, nav, tile }` map. |
| `tileShape` | `EmojiTileShape` | `rounded` | no | Rounded chip vs circle tiles. |
| `rowsCount` | `number` | `6` | no | Scrollable tile-viewport height, in tile rows. |

## Value
An `EmojiCatalogEntry` (`{ glyph, label, tags, category }` from `domain/emoji`), or `null` for none. Consumers read whatever field they need — chat reads `entry.glyph`; a QR host reads `entry.glyph` and drives size separately through `EmojiSizeControl`.

## Composition
- Cross-domain: consumes `domain/emoji` (catalog), `foundation/storage` (`StorageBroker`), `foundation/hooks` (`useRecentItems` via `useEmojiPicker`).
- Cross-group: `presentation/actions` (`Button`, `ToggleButton*`), `presentation/layout` (`Stack`), `presentation/forms` (`SearchInput`).
- Headless core: `useEmojiPicker({ value, onChange, storage })` owns the keyword / active category / visible list / recents — reusable behind a custom layout.
- Siblings: `EmojiSizeControl` (standalone size presets) · `EmojiPickerPopover` (popover-hosted trigger + picker).

## Accessibility
- Grid is a single-tab-stop `role="listbox"`; each tile is a `role="option"` `<button>` with `aria-label` (emoji name) + `aria-selected`. Arrow keys + Home/End rove focus.
- Category nav is a single-select `ToggleButtonGroup` labelled "Emoji categories".
- Search is a native `type="search"` input.

## Known limitations
- Base emoji only — no skin-tone variants.
- No custom / uploaded emoji; the catalog is bundled and fixed (regenerated from `@emoji-mart/data`).
