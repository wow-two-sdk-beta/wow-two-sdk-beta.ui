<script lang="ts">
export interface MultiSelectItemProps {
  /** The value this row contributes to the selection. */
  value: string;

  /** The disabled state for this row. */
  isDisabled?: boolean;

  /**
   * The chip text registered for the trigger. Defaults to `value`.
   *
   * React registered the row's `children` (a `ReactNode`); a slot cannot be captured into
   * the label registry, so the scalar lives here and the default slot renders the row.
   */
  label?: string | number;
}
</script>

<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue';
import { ListboxItem } from '../listbox';
import { useMultiSelectContext } from './MultiSelectContext';

/** One selectable row. Registers its chip text with the surrounding `MultiSelect`. */
defineOptions({ name: 'MultiSelectItem', inheritAttrs: false });

/** The row content — React's required `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<MultiSelectItemProps>(), { isDisabled: false });

const el = useTemplateRef<InstanceType<typeof ListboxItem>>('el');

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useMultiSelectContext();

const registeredLabel = computed<string | number>(() => props.label ?? props.value);

/* Registers only — never unregisters; items unmount on popover close and the tags still
   need the labels. `immediate` because the first registration has to happen on mount, and
   nothing in this watcher touches the DOM. */
watch([() => props.value, registeredLabel], ([value, label]) => ctx.registerLabel(value, label), { immediate: true });
</script>

<template>
  <ListboxItem ref="el" :value="value" :is-disabled="isDisabled">
    <slot />
  </ListboxItem>
</template>
