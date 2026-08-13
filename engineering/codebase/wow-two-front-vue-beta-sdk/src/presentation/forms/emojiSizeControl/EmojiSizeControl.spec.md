# EmojiSizeControl

## Purpose
Standalone emoji size control — a small single-select tile set that previews a given glyph at each preset size (Small / Medium / Large), emitting a host-width ratio. Decoupled from `EmojiPicker`: compose it wherever a host (e.g. a QR center glyph) needs a per-emoji scale; the picker itself is size-agnostic.

## Anatomy
```
<EmojiSizeControl>
  └── <ControlGroup label="Size">      (layout/controlGroup)
        └── <OptionTileGroup>          (actions/optionTileGroup)
              └── <OptionTile> × 3     (each previews `glyph` at that preset's px)
```

## Required behaviors
- Renders one tile per `CenterEmojiSize` preset; each tile previews the passed `glyph` at that preset's px size, capped at `maxPreviewGlyph`.
- The tile whose ratio matches `sizeRatio` (within a small epsilon) reads as selected (`aria-pressed`).
- Selecting a tile emits that preset's `ratio` via `onChange`; re-selecting the active tile is a harmless no-op (single-select `OptionTile`).
- Fully controlled — it owns no ratio state.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `glyph` | `string` | — | yes | The emoji previewed inside every tile. |
| `sizeRatio` | `number` | — | yes | The controlled ratio; drives which tile is selected. |
| `onChange` | `(ratio: number) => void` | — | yes | Emits the picked preset's host-width ratio. |
| `size` | `OptionTileProps['size']` | `sm` | no | The preset-tile scale, forwarded to each `OptionTile`. |
| `maxPreviewGlyph` | `number` | `24` | no | Caps each tile's preview glyph, in px, so it never clips the tile frame. |

## Composition
- Cross-group: `presentation/actions` (`OptionTile`, `OptionTileGroup`), `presentation/layout` (`ControlGroup`).
- Config: `CenterEmojiSize` presets + `CenterEmojiSizeDisplays` (label / ratio / preview-glyph px) + `DefaultEmojiSize` + `DefaultMaxPreviewGlyph`, all exported from the folder barrel.

## Accessibility
- Wrapped in a labelled `OptionTileGroup` ("Emoji size"); each tile is a single-select toggle with an `aria-label` (`Size: {preset}`) and `aria-pressed`.

## Known limitations
- Three fixed presets — no continuous slider or custom ratios.
