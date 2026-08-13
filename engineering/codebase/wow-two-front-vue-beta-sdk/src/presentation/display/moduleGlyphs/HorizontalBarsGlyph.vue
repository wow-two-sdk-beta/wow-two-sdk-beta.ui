<script lang="ts">
import type { GlyphProps } from './ModuleGlyphs';

export type { GlyphProps };
</script>

<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { BAR_CORNER_RX, CELL_POSITIONS, CELL_SIZE } from './ModuleGlyphs';

/** Renders a three-horizontal-bar glyph. */
defineOptions({ name: 'HorizontalBarsGlyph' });

const props = withDefaults(defineProps<GlyphProps>(), { size: 20 });

const el = useTemplateRef<SVGSVGElement>('el');

defineExpose({ el });
</script>

<template>
  <svg ref="el" viewBox="0 0 24 24" :width="props.size" :height="props.size" aria-hidden="true">
    <rect
      v-for="y in CELL_POSITIONS"
      :key="y"
      :x="4"
      :y="y"
      :width="16"
      :height="CELL_SIZE"
      :rx="BAR_CORNER_RX"
      fill="currentColor"
    />
  </svg>
</template>
