<script lang="ts">
import type {
  SurfaceElevation,
  SurfacePadding,
  SurfaceRadius,
  SurfaceTone,
  SurfaceVariant,
} from '../../../foundation/utils';

/**
 * Represents the prop surface of the `SelectContent`.
 *
 * React declared the surface axes by `extends SurfaceVariants`; they are spelled
 * out here because the SFC compiler's type resolver cannot follow a
 * `VariantProps<typeof …>` base and fails the build on it while `vue-tsc` stays
 * green. The aliases below are the canonical ones from `foundation/utils`.
 */
export interface SelectContentProps {
  /** The visual recipe. */
  variant?: SurfaceVariant;

  /** The color tone the recipe is tinted with. */
  tone?: SurfaceTone;

  /** The corner rounding. */
  radius?: SurfaceRadius;

  /** The inner spacing step. Defaults to `none`. */
  padding?: SurfacePadding;

  /** The shadow depth. */
  elevation?: SurfaceElevation;

  /** The searchable state, rendering a search input above the items and filtering by label substring. */
  isSearchable?: boolean;

  /** The placeholder of the search input. */
  searchPlaceholder?: string;

  /** The label rendered when the search yields no matches. */
  noResultsLabel?: string | number;

  /** The match-width behavior, locking the surface width to the trigger's and truncating long items. */
  matchWidth?: boolean;
}

/** The navigation keys the search input forwards to the Listbox keyboard handler. */
const FORWARDED_NAV_KEYS = new Set([
  'ArrowDown',
  'ArrowUp',
  'Home',
  'End',
  'PageDown',
  'PageUp',
  'Enter',
]);
</script>

<script setup lang="ts">
import { computed, useTemplateRef, watch, type ComponentPublicInstance } from 'vue';
import { Loader2 } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { PopoverContent } from '../../overlays';
import Listbox from '../listbox/Listbox.vue';
import ListboxEmpty from '../listbox/ListboxEmpty.vue';
import SearchInput from '../searchInput/SearchInput.vue';
import { useSelectContext } from './SelectContext';

const LoaderIcon = Loader2;

/** Provides the floating panel that hosts the items below the trigger. */
defineOptions({ name: 'SelectContent', inheritAttrs: false });

/** The item list — `SelectItem`, `ListboxGroup`, `ListboxSeparator`. React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<SelectContentProps>(), {
  isSearchable: false,
  searchPlaceholder: 'Search…',
  noResultsLabel: 'No results',
  matchWidth: false,
});

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useSelectContext();

const hasItems = computed(() => ctx.items.length > 0);

const visibleCount = computed(() =>
  ctx.query
    ? ctx.items.filter((i) => i.text.toLowerCase().includes(ctx.query.toLowerCase())).length
    : ctx.items.length,
);

const showEmpty = computed(() => hasItems.value && visibleCount.value === 0);

const listbox = useTemplateRef<ComponentPublicInstance & { el?: HTMLElement | null }>('listbox');

/* Publishes the Listbox's DOM node onto the context so the search input's keyboard bridge can
   re-dispatch nav keys onto it. React passed `ctx.listboxRef` straight in as a ref. */
watch(
  listbox,
  (instance) => {
    const node = (instance?.el ?? instance?.$el ?? null) as HTMLElement | null;
    ctx.listboxEl.value = node;
  },
  { immediate: true, flush: 'post' },
);

/* Bridges nav keys from the search input to the Listbox by re-dispatching a bubbling
   KeyboardEvent onto the listbox node; printable chars stay in the input for filtering. The
   active-id change is mirrored back via the Listbox's `active-change` after commit. */
function handleSearchKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    /* Let the popover's DismissableLayer close + restore focus to the trigger. */
    return;
  }
  if (!FORWARDED_NAV_KEYS.has(event.key)) return;
  const node = ctx.listboxEl.value;
  if (!node) return;
  event.preventDefault();
  node.dispatchEvent(
    new KeyboardEvent('keydown', { key: event.key, bubbles: true, cancelable: true }),
  );
}

function onListboxValueChange(next: unknown): void {
  if (next === null || next === undefined) return;
  const entry = ctx.items.find((i) => ctx.keyEquals(i.itemKey, next));
  if (entry) ctx.onSelect(entry);
}

const contentClass = computed(() =>
  cn(
    'overflow-hidden',
    /* Truncate the option's first content child (the label) so trailing meta stays visible.
       Targets ListboxItem's stable `data-listbox-item-content` wrapper rather than a deep
       `[role=option]>span.flex-1>:first-child` chain that breaks if the markup shifts. */
    props.matchWidth
      ? 'w-(--anchor-width) [&_[data-listbox-item-content]>:first-child]:truncate'
      : 'w-auto min-w-(--anchor-width)',
  ),
);

const selectedForListbox = computed(() => ctx.selectedKey ?? undefined);
</script>

<template>
  <PopoverContent
    :variant="variant"
    :tone="tone"
    :radius="radius"
    :padding="padding ?? 'none'"
    :elevation="elevation"
    :class="contentClass"
  >
    <div v-if="isSearchable" class="border-b border-border p-1">
      <SearchInput
        size="sm"
        autofocus
        role="combobox"
        aria-expanded="true"
        :aria-controls="ctx.listboxId"
        :aria-activedescendant="ctx.activeDescendant ?? undefined"
        aria-autocomplete="list"
        :model-value="ctx.query"
        :placeholder="searchPlaceholder"
        is-clearable
        class="rounded-sm"
        @update:model-value="ctx.setQuery($event)"
        @keydown="handleSearchKeyDown"
        @clear="ctx.setQuery('')"
      />
    </div>
    <Listbox
      ref="listbox"
      :id="ctx.listboxId"
      :model-value="selectedForListbox"
      :is-equal="ctx.keyEquals"
      variant="flat"
      radius="none"
      :tabindex="isSearchable ? -1 : 0"
      @value-change="onListboxValueChange"
      @active-change="ctx.setActiveDescendant($event)"
    >
      <!--
        In-list loading affordance — visible when options resolve asynchronously while the panel
        is open (e.g. a dependent re-fetch). Suppresses the no-results message so a mid-load
        empty set doesn't read as "no results".
      -->
      <div
        v-if="ctx.isLoading"
        role="status"
        class="flex items-center gap-2 px-2 py-2 text-sm text-subtle-foreground"
      >
        <LoaderIcon class="h-4 w-4 animate-spin" />
        <span>{{ ctx.loadingLabel }}</span>
      </div>
      <slot />
      <ListboxEmpty v-if="!ctx.isLoading && showEmpty">{{ noResultsLabel }}</ListboxEmpty>
    </Listbox>
  </PopoverContent>
</template>
