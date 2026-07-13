import { type CSSProperties, type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { Key } from '../../../foundation/utils';
import { type EmojiCatalogEntry } from '../../../domain/emoji';

import { EmojiEmptyLabels, type EmojiPickerSize, EmojiPickerSizes, type EmojiTileShape } from './EmojiPicker.variants';
import { EmojiTile } from './EmojiTile';

/** Reads the grid's live column count from its resolved `grid-template-columns` — the step size for a vertical arrow move. */
function columnCount(grid: HTMLElement): number {
  const template = getComputedStyle(grid).gridTemplateColumns;
  return template ? template.split(' ').length : 1;
}

/** Defines props for the emoji tile grid. */
export interface EmojiGridProps {
  /** The emoji to lay out, in order. */
  readonly emojis: readonly EmojiCatalogEntry[];

  /** The selected emoji's glyph, or `null`. */
  readonly selectedGlyph: string | null;

  /** The tile scale. */
  readonly size: EmojiPickerSize;

  /** The tile frame — rounded chip or circle. */
  readonly shape: EmojiTileShape;

  /** Selects an emoji. */
  readonly onSelect: (entry: EmojiCatalogEntry) => void;

  /** The muted hint shown when `emojis` is empty. */
  readonly emptyLabel?: string;

  /** The fixed viewport height, in tile rows; when set, the grid scrolls inside a constant-height box. */
  readonly viewportRows?: number;

  /** The scrollbar thumb color — any CSS color. Default `var(--color-border-strong)`. */
  readonly scrollThumbColor?: string;
}

/**
 * Renders emoji as an auto-filling `listbox`, or a muted hint when the set is empty. A single roving `tabindex`
 * keeps the ~1870-tile grid to one tab stop; arrow keys (plus Home / End) move focus between options.
 */
export function EmojiGrid({ emojis, selectedGlyph, size, shape, onSelect, emptyLabel, viewportRows, scrollThumbColor }: EmojiGridProps) {
  const { tile, gap } = EmojiPickerSizes[size];

  const gridRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Return the roving stop to the first tile whenever the visible set changes (category switch, search) — the tab
  // stop moves back to tile 0 without stealing focus.
  useEffect(() => setActiveIndex(0), [emojis]);

  function moveFocus(event: KeyboardEvent<HTMLDivElement>): void {
    const grid = gridRef.current;
    if (grid === null || emojis.length === 0) return;

    const columns = columnCount(grid);
    let next: number;
    switch (event.key) {
      case Key.ArrowRight:
        next = activeIndex + 1;
        break;
      case Key.ArrowLeft:
        next = activeIndex - 1;
        break;
      case Key.ArrowDown:
        next = activeIndex + columns;
        break;
      case Key.ArrowUp:
        next = activeIndex - columns;
        break;
      case Key.Home:
        next = 0;
        break;
      case Key.End:
        next = emojis.length - 1;
        break;
      default:
        return;
    }

    next = Math.max(0, Math.min(next, emojis.length - 1));
    event.preventDefault();
    if (next === activeIndex) return;

    setActiveIndex(next);
    grid.querySelectorAll<HTMLElement>('[role="option"]')[next]?.focus();
  }

  if (emojis.length === 0) {
    return <p className="py-6 text-center text-xs text-muted-foreground">{emptyLabel ?? EmojiEmptyLabels.category}</p>;
  }

  // Clamp the roving stop for the transient render before the reset effect runs, so no out-of-range tile is active.
  const activeStop = Math.min(activeIndex, emojis.length - 1);

  const grid = (
    <div
      ref={gridRef}
      role="listbox"
      aria-label="Emoji"
      onKeyDown={moveFocus}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${tile}px, 1fr))`,
        gap,
      }}
    >
      {emojis.map((entry, index) => (
        <EmojiTile
          key={entry.glyph}
          entry={entry}
          selected={entry.glyph === selectedGlyph}
          size={size}
          shape={shape}
          isActive={index === activeStop}
          onSelect={onSelect}
        />
      ))}
    </div>
  );

  if (viewportRows === undefined) return grid;

  // Default to a slightly darker neutral than the hairline border so the bar reads clearly; any CSS color plugs in.
  // Falls back to `--color-border` for themes that don't define the stronger token — never worse than the old bar.
  const thumbColor = scrollThumbColor ?? 'var(--color-border-strong, var(--color-border))';
  const viewportStyle = {
    height: viewportRows * (tile + gap),
    overflowY: 'auto',
    scrollbarGutter: 'stable',
    // Firefox: a slim bar with the resolved thumb color over a transparent track.
    scrollbarWidth: 'thin',
    scrollbarColor: `${thumbColor} transparent`,
    // Drives the WebKit thumb below — arbitrary-variant classes can't read a prop, so route it through a CSS var.
    '--emoji-scroll-thumb': thumbColor,
  } as CSSProperties;
  // WebKit/Blink: same treatment via the shadow-DOM scrollbar pseudo-elements (not inline-styleable),
  // expressed as Tailwind arbitrary variants — ~8px, transparent track, rounded thumb on the resolved color.
  const scrollbarClass =
    '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent ' +
    '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--emoji-scroll-thumb)]';
  return (
    <div className={scrollbarClass} style={viewportStyle}>
      {grid}
    </div>
  );
}
