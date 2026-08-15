<script lang="ts">
export interface ComboboxItemProps {
  /** The value this option selects. */
  value: string;

  /** The disabled state for this option. Default `false`. */
  isDisabled?: boolean;

  /**
   * The plain-text label registered for the input's fill-on-select. Defaults to `value`.
   *
   * React registered the row's `children` (a `ReactNode`) and narrowed it with a
   * `typeof === 'string'` check; a slot cannot be captured into the registry, so the scalar
   * lives here and the default slot renders the row.
   */
  label?: string | number;
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, useAttrs, useTemplateRef, watch } from 'vue';
import type { ClassValue } from 'clsx';
import { Check } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import { listboxItemVariants, ListboxItemState } from '../listbox/Listbox.variants';
import { useComboboxContext, type ComboboxItemEntry } from './ComboboxContext';

/** A single selectable option. Registers itself so keyboard nav and selection can see it. */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call. */
defineOptions({ name: 'ComboboxItem', inheritAttrs: false });

/** The row content — React's required `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<ComboboxItemProps>(), { isDisabled: false });

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useComboboxContext();

const id = useId('combobox-item');

const entry = computed<ComboboxItemEntry>(() => ({
  id,
  value: props.value,
  isDisabled: props.isDisabled,
  label: props.label ?? props.value,
}));

/* `immediate` so the option is in the registry from mount — nothing here touches the DOM, so
   it is safe during SSR. Seeding the first active id lives in `ComboboxContent`, which watches
   the registry once instead of every item doing it. */
watch(entry, (next) => ctx.registerItem(next), { immediate: true });
onBeforeUnmount(() => ctx.unregisterItem(id));

const isSelected = computed(() => ctx.value === props.value);
const isActive = computed(() => ctx.activeId === id);

const state = computed(() => {
  if (props.isDisabled) return ListboxItemState.Disabled;
  if (isSelected.value) return ListboxItemState.Selected;
  return isActive.value ? ListboxItemState.Active : ListboxItemState.Default;
});

/* Runs after any caller-supplied `@click` (declared after `v-bind`), exactly as React's
   `onClick?.(e)` ran before this body. */
function onClick(event: MouseEvent): void {
  if (event.defaultPrevented || props.isDisabled) return;
  ctx.selectItem(entry.value);
}

function onPointerenter(): void {
  if (!props.isDisabled) ctx.setActiveId(id);
}

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rowClass = computed(() => cn(listboxItemVariants({ state: state.value }), attrs.class as ClassValue));

const CheckIcon = Check;

/** The rendered row `<div>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el });
</script>

<template>
  <div
    ref="el"
    :id="id"
    role="option"
    :aria-selected="isSelected"
    :aria-disabled="isDisabled || undefined"
    :data-active="isActive ? '' : undefined"
    :data-selected="isSelected ? '' : undefined"
    :class="rowClass"
    v-bind="passthroughAttrs"
    @click="onClick"
    @pointerenter="onPointerenter"
  >
    <span class="flex-1"><slot /></span>
    <CheckIcon v-if="isSelected" class="h-4 w-4 opacity-80" />
  </div>
</template>
