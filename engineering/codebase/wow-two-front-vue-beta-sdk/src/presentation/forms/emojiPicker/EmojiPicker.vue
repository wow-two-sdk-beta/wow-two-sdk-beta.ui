<script lang="ts">
import type { EmojiCatalogEntry } from '../../../domain/emoji';
import type { StorageBroker } from '../../../foundation/storage';
import type {
  CategoryNavVariant,
  EmojiPickerSizeInput,
  EmojiTileShape,
} from './EmojiPicker.variants';

/** Defines props for the emoji picker. */
export interface EmojiPickerProps {
  /** The current emoji catalog entry, or `null` for none. The `v-model` binding target. */
  readonly modelValue?: EmojiCatalogEntry | null;

  /** The current emoji catalog entry — React's spelling of `modelValue`, which wins when both are set. */
  readonly value?: EmojiCatalogEntry | null;

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

  /** The heading rendered above the picker. Default `Emoji`. */
  readonly label?: string;

  /** When `true` and no emoji has been used yet, opens on the first real category instead of the empty recents bucket. Default `false`. */
  readonly showFirstCategoryWhenRecentsEmpty?: boolean;

  /** The scrollbar thumb color for the tile viewport — any CSS color. Default `var(--color-border-strong)`. */
  readonly scrollThumbColor?: string;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { ColorTone, SizePreset } from '../../../foundation/utils';
import { Button, ButtonVariant } from '../../actions';
import { Stack } from '../../layout';
import SearchInput from '../searchInput/SearchInput.vue';

import CategoryNav from './CategoryNav.vue';
import EmojiGrid from './EmojiGrid.vue';
import { useEmojiPicker } from './useEmojiPicker';
import {
  CategoryNavVariant as CategoryNavVariantValue,
  DefaultPickerSize,
  EmojiEmptyLabels,
  EmojiTileShape as EmojiTileShapeValue,
  PickerElement,
  RecentCategory,
  resolveElementSize,
} from './EmojiPicker.variants';

/**
 * Emoji picker — search + recents + a swappable category nav over the full bundled emoji catalog.
 * `value = null` means no emoji. Fully controlled: it emits the picked `EmojiCatalogEntry` (or `null`) via
 * `@value-change` / `v-model` — consumers read whatever field they need (`entry.glyph`, `entry.label`, …) —
 * and reads its recents through the injected `storage` broker. Size is a separate concern — compose
 * `EmojiSizeControl` (passing `entry.glyph`) when a host needs a per-emoji scale.
 */
defineOptions({ name: 'EmojiPicker' });

const props = withDefaults(defineProps<EmojiPickerProps>(), {
  categoryNavVariant: CategoryNavVariantValue.Strip,
  tileShape: EmojiTileShapeValue.Rounded,
  rowsCount: 6,
  label: 'Emoji',
  showFirstCategoryWhenRecentsEmpty: false,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [entry: EmojiCatalogEntry | null];
  /** Replaces React's `onChange`. Carries the picked entry, or `null` on clear. */
  'value-change': [entry: EmojiCatalogEntry | null];
}>();

const currentValue = computed(() => props.modelValue ?? props.value ?? null);

function onChange(entry: EmojiCatalogEntry | null): void {
  emit('update:modelValue', entry);
  emit('value-change', entry);
}

const picker = useEmojiPicker({
  value: () => currentValue.value,
  onChange,
  storage: props.storage,
  showFirstCategoryWhenRecentsEmpty: () => props.showFirstCategoryWhenRecentsEmpty,
});

const searchSize = computed(() =>
  resolveElementSize(props.size, PickerElement.Search, DefaultPickerSize),
);
const navSize = computed(() => resolveElementSize(props.size, PickerElement.Nav, DefaultPickerSize));
const tileSize = computed(() =>
  resolveElementSize(props.size, PickerElement.Tile, DefaultPickerSize),
);
/* The strip icon is a single dimension → px straight off the size object (undefined for a
   uniform scale → CategoryNav's nav-derived default). */
const iconSize = computed(() => (typeof props.size === 'object' ? props.size.icon : undefined));

const selectedGlyph = computed(() => picker.selected.value?.glyph ?? null);
const isNoneSelected = computed(() => currentValue.value === null);

const emptyLabel = computed(() => {
  if (picker.showSearch.value) return EmojiEmptyLabels.search;
  return picker.activeCategory.value === RecentCategory
    ? EmojiEmptyLabels.recents
    : EmojiEmptyLabels.category;
});
</script>

<template>
  <Stack gap="3">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">{{ label }}</span>
      <Button
        :variant="isNoneSelected ? undefined : ButtonVariant.Outline"
        :tone="isNoneSelected ? ColorTone.Primary : ColorTone.Neutral"
        :size="SizePreset.Sm"
        :aria-pressed="isNoneSelected"
        @click="picker.clearSelection()"
      >
        None
      </Button>
    </div>

    <SearchInput
      :size="searchSize"
      placeholder="Search emoji…"
      :model-value="picker.searchKeyword.value"
      @update:model-value="picker.searchKeyword.value = $event"
      @clear="picker.searchKeyword.value = ''"
    />

    <Stack gap="2">
      <CategoryNav
        v-if="!picker.showSearch.value"
        :variant="categoryNavVariant"
        :active="picker.activeCategory.value"
        :size="navSize"
        :icon-size="iconSize"
        @select="picker.activeCategory.value = $event"
      />
      <EmojiGrid
        :emojis="picker.visibleEmojis.value"
        :selected-glyph="selectedGlyph"
        :size="tileSize"
        :shape="tileShape"
        :viewport-rows="rowsCount"
        :scroll-thumb-color="scrollThumbColor"
        :empty-label="emptyLabel"
        @select="picker.selectEmoji($event)"
      />
    </Stack>
  </Stack>
</template>
