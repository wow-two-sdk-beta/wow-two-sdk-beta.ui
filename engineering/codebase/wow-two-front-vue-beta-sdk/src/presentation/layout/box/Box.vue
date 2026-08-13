<script lang="ts">
import type { ElementType } from '../../../foundation/utils';

export interface BoxProps {
  /** The HTML element to render. Default `div`. */
  as?: ElementType;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * The lowest-level layout primitive. Renders any element (default `div`)
 * with className passthrough. Use as a styling shell when no other layout
 * atom fits.
 *
 * `inheritAttrs: false` so a caller's `class` goes through `cn` (tailwind-merge
 * resolves the conflict) instead of Vue's blind class concatenation — the same
 * last-wins precedence React's `cn(…, className)` gives.
 */
defineOptions({ name: 'Box', inheritAttrs: false });

const props = withDefaults(defineProps<BoxProps>(), { as: 'div' });

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const classes = computed(() => cn(attrs.class as string | undefined));

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
