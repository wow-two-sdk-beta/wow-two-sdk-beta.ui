<script lang="ts">
import type { Size } from '../../../foundation/utils';
import type { SpinnerTone } from './Spinner.variants';

export interface SpinnerProps {
  /** The diameter step. */
  size?: Size;
  /** The color tone. */
  tone?: SpinnerTone;
  /** The accessible label. Default `"Loading"`. */
  label?: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { spinnerVariants } from './Spinner.variants';

/**
 * Indeterminate loading spinner. Renders a spinning circle and a visually
 * hidden text label for screen readers.
 *
 * Distinct from `foundation/icons`' `Spinner`: that one is an em-sized SVG
 * glyph, this one is the bordered circle with its own `size` / `tone` scale.
 *
 * `role="status"` is bound before `v-bind="rest"` so a caller-supplied `role`
 * still wins — the React original's `role = 'status'` destructured default.
 */
defineOptions({ name: 'Spinner', inheritAttrs: false });

const props = withDefaults(defineProps<SpinnerProps>(), { label: 'Loading' });

const attrs = useAttrs();
const el = useTemplateRef<HTMLSpanElement>('el');

/** The caller's `class` lands on the spinning circle, not the outer wrapper — as in React. */
const classes = computed(() =>
  cn(spinnerVariants({ size: props.size, tone: props.tone }), attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied to the inner circle above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <span ref="el" role="status" v-bind="rest">
    <span :class="classes" />
    <span class="sr-only">{{ props.label }}</span>
  </span>
</template>
