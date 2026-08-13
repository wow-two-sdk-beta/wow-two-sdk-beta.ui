<script lang="ts">
/** Represents the prop surface of `Listbox.Group`. */
export interface ListboxGroupProps {
  /**
   * The optional group heading rendered above the contained items. Fill the
   * `label` slot instead for richer content; the prop stays the discriminator.
   */
  label?: string | number;
}
</script>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { useId } from '../../../foundation/hooks';
import { listboxGroupLabelVariants } from './Listbox.variants';

/** Provides a labelled group wrapping a subset of items. */
/* `inheritAttrs` stays ON: React put `className` straight onto the group div with no `cn()`
   merge of its own, so plain fallthrough reproduces it exactly. */
defineOptions({ name: 'ListboxGroup' });

const props = defineProps<ListboxGroupProps>();

const slots = useSlots();
const labelId = useId();

const hasLabel = computed(() => Boolean(props.label) || Boolean(slots.label));
</script>

<template>
  <div role="group" :aria-labelledby="hasLabel ? labelId : undefined">
    <div v-if="hasLabel" :id="labelId" :class="listboxGroupLabelVariants()">
      <slot name="label">{{ label }}</slot>
    </div>
    <slot />
  </div>
</template>
