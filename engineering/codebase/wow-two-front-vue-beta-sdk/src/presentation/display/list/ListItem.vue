<script lang="ts">
export interface ListItemProps {
  /** The auto-check-marker mode — renders a check marker if the parent List uses `marker="check"`. */
  hasCheckMarker?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { Check } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { listItemVariants } from './List.variants';

/** A `List` row — optional check marker, leading and trailing adornments. */
defineOptions({ name: 'ListItem', inheritAttrs: false });

defineSlots<{
  /** The leading slot — icon, avatar, marker. React's `leading` node prop. */
  leading?(): unknown;
  /** The trailing slot — badge, chevron, status. React's `trailing` node prop. */
  trailing?(): unknown;
  /** The row content — React's required `children`. */
  default(): unknown;
}>();

const props = withDefaults(defineProps<ListItemProps>(), { hasCheckMarker: undefined });

const attrs = useAttrs();
const el = useTemplateRef<HTMLLIElement>('el');

const classes = computed(() =>
  cn(listItemVariants(), attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <li ref="el" v-bind="rest" :class="classes">
    <span v-if="props.hasCheckMarker" aria-hidden="true" class="mt-0.5 shrink-0 text-primary">
      <Check class="h-4 w-4" />
    </span>
    <span v-if="$slots.leading" aria-hidden="true" class="mt-0.5 shrink-0 text-muted-foreground">
      <slot name="leading" />
    </span>
    <span class="flex-1"><slot /></span>
    <span v-if="$slots.trailing" class="shrink-0 text-muted-foreground"
      ><slot name="trailing"
    /></span>
  </li>
</template>
