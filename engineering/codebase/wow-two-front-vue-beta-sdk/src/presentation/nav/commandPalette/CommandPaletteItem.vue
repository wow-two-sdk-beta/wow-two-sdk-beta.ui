<script lang="ts">
export interface CommandPaletteItemProps {
  value: string;

  /**
   * The text used by the filter; defaults to `value`.
   *
   * React additionally fell back to `children` when they were a plain string.
   * A Vue slot's text cannot be read at setup time without invoking the slot
   * outside the render function (which Vue warns about, and which would not
   * work at all for an item filtered out of the DOM), so the fallback is
   * `value` — pass `searchText` whenever the visible label differs from it.
   */
  searchText?: string;

  isDisabled?: boolean;

  /** The close-on-activate toggle. Default `true`. */
  closeOnSelect?: boolean;
}
</script>

<script setup lang="ts">
import { computed, onScopeDispose, useAttrs, useTemplateRef, watch } from 'vue';
import { cn } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import { listboxItemVariants } from '../../forms/listbox/Listbox.variants';
import { useCommandPaletteContext } from './CommandPaletteContext';

/** One `role="option"` row. Hides itself when the current filter excludes it. */
defineOptions({ name: 'CommandPaletteItem', inheritAttrs: false });

/** The row content — React's `children`. */
defineSlots<{ default(): unknown }>();

/** `isDisabled` defaults to `undefined`, not `false` — an absent optional boolean must stay absent. */
const props = withDefaults(defineProps<CommandPaletteItemProps>(), {
  searchText: undefined,
  isDisabled: undefined,
  closeOnSelect: true,
});

const emit = defineEmits<{
  /** Replaces React's `onSelect` — the item was activated (Enter / click). */
  select: [];
}>();

const attrs = useAttrs();
const context = useCommandPaletteContext();
const el = useTemplateRef<HTMLDivElement>('el');
const id = useId();

const resolvedSearch = computed(() => props.searchText ?? props.value);

watch(
  [() => props.value, resolvedSearch, () => props.isDisabled, () => props.closeOnSelect],
  ([value, searchText, isDisabled, closeOnSelect]) => {
    context.registerItem({
      id,
      value,
      searchText,
      disabled: isDisabled === true,
      select: () => emit('select'),
      closeOnSelect,
    });
  },
  { immediate: true, flush: 'post' },
);

onScopeDispose(() => context.unregisterItem(id));

/** Hidden when the current filter excludes it — React returned `null` for the same case. */
const matches = computed(
  () =>
    context.inputValue.value === '' ||
    context.filter(resolvedSearch.value, context.inputValue.value),
);

const isActive = computed(() => context.activeId.value === id);

const state = computed(() =>
  props.isDisabled ? 'disabled' : isActive.value ? 'active' : 'default',
);

function handleClick(event: MouseEvent): void {
  if (event.defaultPrevented || props.isDisabled) return;
  emit('select');
  if (props.closeOnSelect) context.setOpen(false);
}

function handlePointerEnter(): void {
  if (!props.isDisabled) context.setActiveId(id);
}

const classes = computed(() =>
  cn(listboxItemVariants({ state: state.value }), attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <!-- Own attrs, then `v-bind="rest"`, then own handlers last — a consumer's
       handler therefore runs first, the order React got from calling
       `onClick?.(e)` ahead of its own logic. -->
  <div
    v-if="matches"
    :id="id"
    ref="el"
    role="option"
    :aria-selected="isActive"
    :aria-disabled="props.isDisabled || undefined"
    :data-active="isActive ? '' : undefined"
    v-bind="rest"
    :class="classes"
    @click="handleClick"
    @pointerenter="handlePointerEnter"
  >
    <slot />
  </div>
</template>
