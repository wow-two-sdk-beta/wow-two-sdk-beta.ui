<script lang="ts">
import type { GlyphProps } from './ModuleGlyphs';

export type { GlyphProps };
</script>

<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { BAR_CORNER_RX, CELL_POSITIONS, CELL_SIZE } from './ModuleGlyphs';

/** Renders a three-vertical-bar glyph. */
defineOptions({ name: 'VerticalBarsGlyph' });

const props = withDefaults(defineProps<GlyphProps>(), { size: 20 });

const el = useTemplateRef<SVGSVGElement>('el');

defineExpose({ el });
</script>

<template>
  <svg ref="el" viewBox="0 0 24 24" :width="props.size" :height="props.size" aria-hidden="true">
    <rect
      v-for="x in CELL_POSITIONS"
      :key="x"
      :x="x"
      :y="4"
      :width="CELL_SIZE"
      :height="16"
      :rx="BAR_CORNER_RX"
      fill="currentColor"
    />
  </svg>
</template>
