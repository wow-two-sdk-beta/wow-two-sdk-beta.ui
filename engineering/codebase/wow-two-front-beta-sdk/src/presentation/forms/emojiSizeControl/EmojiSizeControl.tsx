import { OptionTile, OptionTileGroup, type OptionTileProps } from '../../actions';
import { ControlGroup } from '../../layout';

import { CenterEmojiSize, CenterEmojiSizeDisplays, DefaultMaxPreviewGlyph } from './EmojiSizeControl.variants';

/** Defines props for the emoji size control. */
export interface EmojiSizeControlProps {
  /** The emoji rendered inside each tile, so the choice previews the real glyph at that size. */
  readonly glyph: string;

  /** The current size ratio. */
  readonly sizeRatio: number;

  /** Emits the next size ratio. */
  readonly onChange: (ratio: number) => void;

  /** The preset-tile scale, forwarded to each `OptionTile`. Default `sm`. */
  readonly size?: OptionTileProps['size'];

  /** The largest preview glyph, in px — caps each tile's glyph so it never clips the `OptionTile` frame. Default `24`. */
  readonly maxPreviewGlyph?: number;
}

/** Renders the emoji size as a small tile set — each tile previews the given glyph at that preset size, no numbers. */
export function EmojiSizeControl({
  glyph,
  sizeRatio,
  onChange,
  size,
  maxPreviewGlyph = DefaultMaxPreviewGlyph,
}: EmojiSizeControlProps) {
  return (
    <ControlGroup label="Size" orientation="vertical" divided={false}>
      <OptionTileGroup label="Emoji size">
        {Object.values(CenterEmojiSize).map((preset) => {
          const display = CenterEmojiSizeDisplays[preset];

          return (
            <OptionTile
              key={preset}
              size={size}
              selected={Math.abs(sizeRatio - display.ratio) < 0.001}
              label={`Size: ${display.label}`}
              onSelect={() => onChange(display.ratio)}
            >
              <span
                className="flex h-full w-full items-center justify-center"
                style={{ fontSize: Math.min(display.glyph, maxPreviewGlyph), lineHeight: 1 }}
              >
                {glyph}
              </span>
            </OptionTile>
          );
        })}
      </OptionTileGroup>
    </ControlGroup>
  );
}
