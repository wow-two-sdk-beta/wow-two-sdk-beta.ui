<script lang="ts">
import type { SpinnerProps } from '../spinner/Spinner.vue';

export interface InlineSpinnerProps {
  size?: SpinnerProps['size'];
  tone?: SpinnerProps['tone'];
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import Spinner from '../spinner/Spinner.vue';

/**
 * Spinner + label inline. Drops cleanly into buttons, list rows, anywhere
 * a "loading…" affordance is needed mid-flow.
 *
 * React's `children` (default `"Loading…"`) becomes the default slot with the
 * same fallback content.
 */
defineOptions({ name: 'InlineSpinner', inheritAttrs: false });

const props = withDefaults(defineProps<InlineSpinnerProps>(), { size: 'sm', tone: 'default' });

const attrs = useAttrs();
const el = useTemplateRef<HTMLSpanElement>('el');

const classes = computed(() =>
  cn(
    'inline-flex items-center gap-2 text-sm text-muted-foreground',
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <span ref="el" v-bind="rest" :class="classes">
    <Spinner :size="props.size" :tone="props.tone" />
    <slot>Loading…</slot>
  </span>
</template>
