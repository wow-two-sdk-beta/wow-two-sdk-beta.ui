<script lang="ts">
import type { GlyphProps } from './ModuleGlyphs';

export type { GlyphProps };
</script>

<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { CELL_POSITIONS, CELL_SIZE } from './ModuleGlyphs';

/** Renders a three-dot glyph. */
defineOptions({ name: 'DotsGlyph' });

const props = withDefaults(defineProps<GlyphProps>(), { size: 20 });

const el = useTemplateRef<SVGSVGElement>('el');

defineExpose({ el });
</script>

<template>
  <svg ref="el" viewBox="0 0 24 24" :width="props.size" :height="props.size" aria-hidden="true">
    <circle v-for="x in CELL_POSITIONS" :key="x" :cx="x + CELL_SIZE / 2" :cy="12" :r="2.5" fill="currentColor" />
  </svg>
</template>
