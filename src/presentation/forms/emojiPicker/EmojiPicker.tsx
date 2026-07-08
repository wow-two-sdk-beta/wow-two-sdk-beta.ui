import { ColorTone, SizePreset } from '../../../foundation/utils';
import { type EmojiCatalogEntry } from '../../../domain/emoji';
import { type StorageBroker } from '../../../foundation/storage';
import { Button, ButtonVariant } from '../../actions';
import { Stack } from '../../layout';
import { SearchInput } from '../searchInput';

import { CategoryNav } from './CategoryNav';
import { EmojiGrid } from './EmojiGrid';
import { useEmojiPicker } from './useEmojiPicker';
import {
  CategoryNavVariant,
  DefaultPickerSize,
  EmojiEmptyLabels,
  type EmojiPickerSizeInput,
  EmojiTileShape,
  PickerElement,
  RecentCategory,
  resolveElementSize,
} from './EmojiPicker.variants';

/** Defines props for the emoji picker. */
export interface EmojiPickerProps {
  /** The current emoji catalog entry, or `null` for none. */
  readonly value: EmojiCatalogEntry | null;

  /** Emits the next emoji catalog entry, or `null` to clear it. */
  readonly onChange: (entry: EmojiCatalogEntry | null) => void;

  /**
   * The persistence contract backing the "recently used" list — required, so the picker stays pure and
   * storage-agnostic. Plug `localStorageStorageBroker` for browser persistence, `memoryStorageBroker()` for a
   * throwaway in-memory store, or a custom `StorageBroker` (Redux, IndexedDB, …).
   */
  readonly storage: StorageBroker;

  /** The category-navigation affordance. Default `strip`. */
  readonly categoryNavVariant?: CategoryNavVariant;

  /** The element scale — one value for every element, or a per-element `{ search, nav, tile }`. Default `md`. */
  readonly size?: EmojiPickerSizeInput;

  /** The emoji-tile frame — rounded chip or circle. Default `rounded`. */
  readonly tileShape?: EmojiTileShape;

  /** The scrollable tile viewport's height, in tile rows. Default `6`. */
  readonly rowsCount?: number;
}

/**
 * Emoji picker — search + recents + a swappable category nav over the full bundled emoji catalog.
 * `value = null` means no emoji. Fully controlled: it emits the picked `EmojiCatalogEntry` (or `null`) via
 * `onChange` — consumers read whatever field they need (`entry.glyph`, `entry.label`, …) — and reads its
 * recents through the injected `storage` broker. Size is a separate concern — compose `EmojiSizeControl`
 * (passing `entry.glyph`) when a host needs a per-emoji scale.
 */
export function EmojiPicker({
  value,
  onChange,
  storage,
  categoryNavVariant = CategoryNavVariant.Strip,
  size,
  tileShape = EmojiTileShape.Rounded,
  rowsCount = 6,
}: EmojiPickerProps) {
  const picker = useEmojiPicker({ value, onChange, storage });

  const searchSize = resolveElementSize(size, PickerElement.Search, DefaultPickerSize);
  const navSize = resolveElementSize(size, PickerElement.Nav, DefaultPickerSize);
  const tileSize = resolveElementSize(size, PickerElement.Tile, DefaultPickerSize);
  const selectedGlyph = picker.selected?.glyph ?? null;

  return (
    <Stack gap="3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Emoji</span>
        <Button
          variant={value === null ? undefined : ButtonVariant.Outline}
          tone={value === null ? ColorTone.Primary : ColorTone.Neutral}
          size={SizePreset.Sm}
          aria-pressed={value === null}
          onClick={picker.clearSelection}
        >
          None
        </Button>
      </div>

      <SearchInput
        size={searchSize}
        placeholder="Search emoji…"
        value={picker.searchKeyword}
        onChange={(event) => picker.setSearchKeyword(event.target.value)}
        onClear={() => picker.setSearchKeyword('')}
      />

      <Stack gap="2">
        {picker.showSearch ? null : (
          <CategoryNav
            variant={categoryNavVariant}
            active={picker.activeCategory}
            onSelect={picker.setActiveCategory}
            size={navSize}
          />
        )}
        <EmojiGrid
          emojis={picker.visibleEmojis}
          selectedGlyph={selectedGlyph}
          size={tileSize}
          shape={tileShape}
          onSelect={picker.selectEmoji}
          viewportRows={rowsCount}
          emptyLabel={
            picker.showSearch
              ? EmojiEmptyLabels.search
              : picker.activeCategory === RecentCategory
                ? EmojiEmptyLabels.recents
                : EmojiEmptyLabels.category
          }
        />
      </Stack>
    </Stack>
  );
}
