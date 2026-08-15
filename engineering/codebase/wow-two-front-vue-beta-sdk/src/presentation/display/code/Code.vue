<script lang="ts">
import type { CodeVariant } from './Code.variants';

export interface CodeProps {
  /** The rendering mode. */
  variant?: CodeVariant;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { codeVariants } from './Code.variants';

/**
 * Inline or block code. For block, wrap children in a `<pre>` if you need
 * pre-wrap whitespace; this atom only styles. Syntax highlighting is L5.
 */
defineOptions({ name: 'Code', inheritAttrs: false });

/** The code text — React's `children`. */
defineSlots<{ default(): unknown }>();

/* No default: `codeVariants`' own `defaultVariants` decides, as in React. */
const props = defineProps<CodeProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const classes = computed(() => cn(codeVariants({ variant: props.variant }), attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <code ref="el" v-bind="rest" :class="classes"><slot /></code>
</template>
