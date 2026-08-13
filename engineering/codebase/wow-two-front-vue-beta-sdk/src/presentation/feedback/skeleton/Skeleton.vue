<script lang="ts">
import type { SkeletonShape } from './Skeleton.variants';

export interface SkeletonProps {
  /** The placeholder shape. */
  shape?: SkeletonShape;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { skeletonVariants } from './Skeleton.variants';

/**
 * Loading placeholder. Use sized via `class` (e.g. `w-32 h-4`) for text
 * lines, or as a full block with `shape="rect"`.
 */
defineOptions({ name: 'Skeleton', inheritAttrs: false });

const props = defineProps<SkeletonProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const classes = computed(() =>
  cn(skeletonVariants({ shape: props.shape }), attrs.class as string | undefined),
);

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
