<script lang="ts">
import type { SkeletonStateShape } from './SkeletonState.variants';

export interface SkeletonStateProps {
  /** The placeholder shape. */
  readonly shape?: SkeletonStateShape;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/styles';
import { skeletonVariants } from './SkeletonState.variants';

/**
 * Renders a shimmering placeholder block standing in for content that is still loading.
 * Size it via `class` (e.g. `w-32 h-4`) for text lines, or pass `shape="rect"` for a full block.
 */
defineOptions({ name: 'SkeletonState', inheritAttrs: false });

const props = defineProps<SkeletonStateProps>();

defineSlots<{
  /** The content shaping the placeholder. Sizing classes alone when omitted. */
  default?(): unknown;
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const classes = computed(() => cn(skeletonVariants({ shape: props.shape }), attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div ref="el" aria-hidden="true" v-bind="rest" :class="classes"><slot /></div>
</template>
