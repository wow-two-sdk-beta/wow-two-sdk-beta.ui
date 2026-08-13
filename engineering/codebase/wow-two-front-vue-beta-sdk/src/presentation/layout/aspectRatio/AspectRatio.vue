<script lang="ts">
export interface AspectRatioProps {
  /** The aspect ratio (width/height). Default 1 (square). */
  ratio?: number;
}
</script>

<script setup lang="ts">
import { computed, normalizeStyle, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * Constrain children to an aspect ratio (width / height). Children are
 * absolutely positioned and stretched to fill — typically pass a single
 * `<img>`, `<video>`, or `<iframe>` with `class="absolute inset-0 w-full h-full"`.
 */
defineOptions({ name: 'AspectRatio', inheritAttrs: false });

const props = withDefaults(defineProps<AspectRatioProps>(), { ratio: 1 });

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const classes = computed(() => cn('relative w-full', attrs.class as string | undefined));

/** `normalizeStyle` merges left → right, so a caller's `style` lands last and wins — as React's `{ aspectRatio, ...style }` did. */
const styles = computed(() => normalizeStyle([{ aspectRatio: `${props.ratio}` }, attrs.style]));

/** Everything but `class` / `style`, both re-applied above. */
const rest = computed(() => {
  const { class: _class, style: _style, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div ref="el" v-bind="rest" :class="classes" :style="styles"><slot /></div>
</template>
