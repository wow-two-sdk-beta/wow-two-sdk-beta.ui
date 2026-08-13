<script lang="ts">
import type { CategoryKey, CategoryNavVariant, EmojiPickerSize } from './EmojiPicker.variants';

/** Defines props for the horizontal category nav. */
export interface CategoryNavProps {
  /** The category-nav layout — segmented icon strip or labelled pills. */
  readonly variant: CategoryNavVariant;

  /** The active category. */
  readonly active: CategoryKey;

  /** The nav scale. */
  readonly size: EmojiPickerSize;

  /** The strip icon size in px. Default `round(nav * 0.8)` derived from the scale. */
  readonly iconSize?: number;
}
</script>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupVariant,
  ToggleButtonVariant,
  ToggleMode,
} from '../../actions';
import {
  CategoryDisplays,
  CategoryNavVariant as CategoryNavVariantValue,
  CategoryOrder,
  EmojiPickerSizes,
} from './EmojiPicker.variants';

/** Renders the category picker as a single-select `ToggleButtonGroup` — a segmented icon strip or a labelled pill row. */
defineOptions({ name: 'CategoryNav' });

const props = defineProps<CategoryNavProps>();

const emit = defineEmits<{
  /** Replaces React's `onSelect`. Carries the chosen category. */
  select: [category: CategoryKey];
}>();

const isPills = computed(() => props.variant === CategoryNavVariantValue.Pills);
const navSize = computed(() => EmojiPickerSizes[props.size].nav);
const stripIconSize = computed(() => props.iconSize ?? Math.round(navSize.value * 0.8));
const stripItemStyle = computed<CSSProperties>(() => ({ height: `${navSize.value}px` }));

const categories = computed(() =>
  CategoryOrder.map((key) => ({ key, label: CategoryDisplays[key].label, icon: CategoryDisplays[key].Icon })),
);

/* A category is always selected: the group emits `null` when the active button is re-clicked —
   ignore it. */
function selectCategory(key: CategoryKey | null | ReadonlyArray<string>): void {
  if (typeof key === 'string') emit('select', key as CategoryKey);
}
</script>

<template>
  <ToggleButtonGroup
    v-if="isPills"
    :type="ToggleMode.Single"
    :is-attached="false"
    :value="active"
    aria-label="Emoji categories"
    class="flex-wrap"
    @value-change="selectCategory"
  >
    <ToggleButton
      v-for="category in categories"
      :key="category.key"
      :value="category.key"
      :variant="ToggleButtonVariant.Outline"
      :size="size"
    >
      {{ category.label }}
    </ToggleButton>
  </ToggleButtonGroup>

  <ToggleButtonGroup
    v-else
    :type="ToggleMode.Single"
    :variant="ToggleButtonGroupVariant.Segmented"
    :value="active"
    aria-label="Emoji categories"
    class="w-full"
    @value-change="selectCategory"
  >
    <ToggleButton
      v-for="category in categories"
      :key="category.key"
      :value="category.key"
      :title="category.label"
      :aria-label="category.label"
      class="flex-1"
      :style="stripItemStyle"
    >
      <component :is="category.icon" :size="stripIconSize" class="shrink-0" aria-hidden="true" />
    </ToggleButton>
  </ToggleButtonGroup>
</template>
