import { useCallback, useMemo, useState } from 'react';

import { EmojiCatalog, EmojiCategory, type EmojiCatalogEntry } from '../../../domain/emoji';
import { useRecentItems } from '../../../foundation/hooks';
import { type StorageBroker } from '../../../foundation/storage';

import { type CategoryKey, EmojiRecentsKey, RecentCategory } from './EmojiPicker.variants';

/** Identifies a recent emoji by its glyph — a stable module-level fn so the recents store's callbacks don't churn per render. */
const emojiGlyphIdentity = (entry: EmojiCatalogEntry): string => entry.glyph;

/** Defines the inputs the picker view-model binds to the live selection value. */
export interface UseEmojiPickerOptions {
  /** The current emoji entry, or `null` for none. */
  readonly value: EmojiCatalogEntry | null;

  /** Emits the next emoji entry, or `null` to clear it. */
  readonly onChange: (entry: EmojiCatalogEntry | null) => void;

  /** The persistence contract backing recents — injected so the picker stays storage-agnostic (localStorage, Redux, …). */
  readonly storage: StorageBroker;

  /** When `true` and recents is empty at mount, the initial category is the first real category, not the recents bucket. Default `false`. */
  readonly showFirstCategoryWhenRecentsEmpty?: boolean;
}

/** Represents the headless picker state — layout-agnostic, shared by every nav variant. */
export interface EmojiPickerModel {
  /** The current search keyword. */
  readonly searchKeyword: string;

  /** Sets the search keyword. */
  readonly setSearchKeyword: (keyword: string) => void;

  /** The active category (or the synthetic recents bucket). */
  readonly activeCategory: CategoryKey;

  /** Selects the active category. */
  readonly setActiveCategory: (category: CategoryKey) => void;

  /** Whether a non-empty keyword is driving the visible list, bypassing categories. */
  readonly showSearch: boolean;

  /** The emoji to render right now — search results, recents, or the active category. */
  readonly visibleEmojis: readonly EmojiCatalogEntry[];

  /** The most-recently-used emoji, most-recent-first. */
  readonly recents: readonly EmojiCatalogEntry[];

  /** The selected emoji entry, or `null` for none. */
  readonly selected: EmojiCatalogEntry | null;

  /** Picks an emoji — sets the selection to that entry and records it as recent. */
  readonly selectEmoji: (entry: EmojiCatalogEntry) => void;

  /** Clears the selected emoji. */
  readonly clearSelection: () => void;
}

/**
 * Manages the emoji picker independent of layout: owns the keyword, the active category, the derived
 * visible list, and the recents MRU — and folds a pick back into the selection entry + the recents list.
 */
export function useEmojiPicker({
  value,
  onChange,
  storage,
  showFirstCategoryWhenRecentsEmpty = false,
}: UseEmojiPickerOptions): EmojiPickerModel {
  const { recents, push } = useRecentItems<EmojiCatalogEntry>(EmojiRecentsKey, {
    identify: emojiGlyphIdentity,
    broker: storage,
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  // Default to the recents bucket; when asked and there are no recents yet, open on the first real category instead.
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(() =>
    showFirstCategoryWhenRecentsEmpty && recents.length === 0 ? EmojiCategory.SmileysPeople : RecentCategory,
  );

  const trimmedKeyword = searchKeyword.trim();
  const showSearch = trimmedKeyword.length > 0;

  const visibleEmojis = useMemo<readonly EmojiCatalogEntry[]>(() => {
    if (showSearch) return EmojiCatalog.search(trimmedKeyword);
    if (activeCategory === RecentCategory) return recents;
    return EmojiCatalog.byCategory(activeCategory);
  }, [showSearch, trimmedKeyword, activeCategory, recents]);

  const selectEmoji = useCallback(
    (entry: EmojiCatalogEntry) => {
      onChange(entry);
      push(entry);
    },
    [onChange, push],
  );

  const clearSelection = useCallback(() => onChange(null), [onChange]);

  return useMemo<EmojiPickerModel>(
    () => ({
      searchKeyword,
      setSearchKeyword,
      activeCategory,
      setActiveCategory,
      showSearch,
      visibleEmojis,
      recents,
      selected: value,
      selectEmoji,
      clearSelection,
    }),
    [searchKeyword, activeCategory, showSearch, visibleEmojis, recents, value, selectEmoji, clearSelection],
  );
}
