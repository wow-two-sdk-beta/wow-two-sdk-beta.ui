<script lang="ts">
import type { GlyphProps } from './ModuleGlyphs';

/** Defines props for the cells glyph. */
export interface CellsGlyphProps extends GlyphProps {
  /** The cells' corner radius. */
  readonly cornerRx: number;
}
</script>

<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { CELL_POSITIONS, CELL_SIZE } from './ModuleGlyphs';

/** Renders a three-cell glyph with the given corner radius. */
defineOptions({ name: 'CellsGlyph' });

const props = withDefaults(defineProps<CellsGlyphProps>(), { size: 20 });

const el = useTemplateRef<SVGSVGElement>('el');

defineExpose({ el });
</script>

<template>
  <svg ref="el" viewBox="0 0 24 24" :width="props.size" :height="props.size" aria-hidden="true">
    <rect
      v-for="x in CELL_POSITIONS"
      :key="x"
      :x="x"
      :y="9.5"
      :width="CELL_SIZE"
      :height="CELL_SIZE"
      :rx="props.cornerRx"
      fill="currentColor"
    />
  </svg>
</template>
