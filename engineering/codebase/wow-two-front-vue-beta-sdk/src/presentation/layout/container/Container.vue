<script lang="ts">
import type { ElementType } from '../../../foundation/utils';
import type { ContainerSize } from './Container.variants';

export interface ContainerProps {
  as?: ElementType;
  /** The max-width preset. Default `lg`. */
  size?: ContainerSize;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { containerVariants } from './Container.variants';

/**
 * Centered max-width wrapper with horizontal padding. Use at page-level to
 * constrain content width.
 */
defineOptions({ name: 'Container', inheritAttrs: false });

const props = withDefaults(defineProps<ContainerProps>(), { as: 'div' });

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const classes = computed(() =>
  cn(containerVariants({ size: props.size }), attrs.class as string | undefined),
);

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
