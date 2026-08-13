<script lang="ts">
import type { ElementType } from '../../../foundation/utils';

export interface FlexProps {
  as?: ElementType;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * Bare flex container — no opinions on direction, gap, or alignment.
 * Use for one-off flex layouts that don't fit `Stack`'s variant matrix.
 */
defineOptions({ name: 'Flex', inheritAttrs: false });

const props = withDefaults(defineProps<FlexProps>(), { as: 'div' });

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const classes = computed(() => cn('flex', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <component :is="props.as" ref="el" v-bind="rest" :class="classes"><slot /></component>
</template>
