import { type CSSProperties } from 'react';

import { type EmojiCatalogEntry } from '../../../domain/emoji';

import { type EmojiPickerSize, EmojiPickerSizes, EmojiTileShape } from './EmojiPicker.variants';

/** Maps each tile shape to its frame classes (border + corner); the selection + hover wash layers on top. */
const TileFrames: Record<EmojiTileShape, string> = {
  [EmojiTileShape.Rounded]: 'rounded-md border',
  [EmojiTileShape.Circle]: 'rounded-full border',
};

/** Defines props for a single selectable emoji tile. */
export interface EmojiTileProps {
  /** The catalog emoji this tile renders. */
  readonly entry: EmojiCatalogEntry;

  /** Whether this tile is the active selection. */
  readonly selected: boolean;

  /** The tile scale. */
  readonly size: EmojiPickerSize;

  /** The tile frame — rounded chip or circle. */
  readonly shape: EmojiTileShape;

  /** Whether this tile holds the grid's single roving tab stop. */
  readonly isActive: boolean;

  /** Selects this emoji. */
  readonly onSelect: (entry: EmojiCatalogEntry) => void;
}

/** Renders one selectable emoji tile as a listbox option — its glyph sized by the picker scale, framed by the tile shape. */
export function EmojiTile({ entry, selected, size, shape, isActive, onSelect }: EmojiTileProps) {
  const { tile, glyph } = EmojiPickerSizes[size];
  const isCircle = shape === EmojiTileShape.Circle;

  const stateClass = selected ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted';

  // A circle must read as round: pin it to a `tile`×`tile` square (so `rounded-full` is a circle, not a pill) and
  // center it in its grid cell. A rounded chip stretches to fill the column, so only its height is fixed.
  const style: CSSProperties = isCircle
    ? { height: tile, width: tile, fontSize: glyph }
    : { height: tile, fontSize: glyph };

  return (
    <button
      type="button"
      role="option"
      title={entry.label}
      aria-label={entry.label}
      aria-selected={selected}
      tabIndex={isActive ? 0 : -1}
      onClick={() => onSelect(entry)}
      className={`flex items-center justify-center leading-none transition-colors ${TileFrames[shape]} ${stateClass} ${
        isCircle ? 'place-self-center' : ''
      }`}
      style={style}
    >
      {entry.glyph}
    </button>
  );
}
