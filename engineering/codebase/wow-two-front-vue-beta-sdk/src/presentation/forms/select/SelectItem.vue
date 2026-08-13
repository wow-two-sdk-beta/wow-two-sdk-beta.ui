<script lang="ts">
/**
 * Represents the prop surface of the `SelectItem`.
 *
 * React's `<K, V = K>` generics are dropped: the exported interface has to live
 * in this plain `<script>` block (a `<script setup>`-only SFC trips
 * `no-unused-vars` on the house attrs idiom), and a block-level interface cannot
 * see a `generic="…"` parameter. The root `Select` stays generic, so the
 * consumer-facing `value` / `@value-change` types are unaffected.
 */
export interface SelectItemProps {
  /** The item key; drives equality, ARIA, and search. */
  itemKey: unknown;

  /** The rich payload returned via `@value-change`; defaults to `itemKey`. */
  value?: unknown;

  /** The label shown in the trigger when this item is selected, and the default search text. */
  label: string | number;

  /** The searchable-text override; defaults to `label`. */
  text?: string;

  /** The disabled state for this item. */
  isDisabled?: boolean;
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import ListboxItem from '../listbox/ListboxItem.vue';
import { extractText, useSelectContext } from './SelectContext';

/**
 * A single option row. Registers with the root on mount and unregisters on unmount,
 * so a removed option leaves the live set used by search / typeahead / value lookup.
 * The label persists in the root's cache, so the trigger stays labelled after the
 * popover closes and items unmount.
 *
 * The in-list rendering override is the default slot (React's `children`); it falls
 * back to `label`. Unlike React, slot content cannot be text-scraped for search — set
 * `text` explicitly when the slot carries the searchable words and `label` does not.
 */
defineOptions({ name: 'SelectItem', inheritAttrs: false });

const props = withDefaults(defineProps<SelectItemProps>(), {
  isDisabled: false,
});

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useSelectContext();

const resolvedValue = computed(() => (props.value === undefined ? props.itemKey : props.value));

/* Explicit `text` wins; otherwise the label's plain text. */
const itemText = computed(() => (props.text !== undefined ? props.text : extractText(props.label)));

watch(
  () => ({
    itemKey: props.itemKey,
    value: resolvedValue.value,
    label: props.label,
    text: itemText.value,
    isDisabled: props.isDisabled,
  }),
  (entry) => ctx.registerItem(entry),
  { immediate: true },
);
onBeforeUnmount(() => ctx.unregisterItem(props.itemKey));

const matchesQuery = computed(
  () => !ctx.query || itemText.value.toLowerCase().includes(ctx.query.toLowerCase()),
);
</script>

<template>
  <!-- ListboxItem compares via the wired keyEquals — same equality math as Select. -->
  <ListboxItem v-if="matchesQuery" :value="itemKey" :is-disabled="isDisabled">
    <slot>{{ label }}</slot>
  </ListboxItem>
</template>
