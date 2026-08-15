<script lang="ts">
import type { ProgressTone, Size } from '../../../foundation/utils';

export interface ProgressBarProps {
  /** The track thickness. */
  size?: Size;
  /** The fill tone palette. */
  tone?: ProgressTone;
  /** The current value 0–100. Pass `undefined` for indeterminate. */
  value?: number;
  max?: number;
  /** The accessible label for the progress. */
  label?: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { progressFillVariants, progressTrackVariants, type ProgressBarVariants } from './ProgressBar.variants';

/**
 * Linear progress indicator. Set `value` (0–`max`) for determinate; omit
 * for indeterminate.
 */
defineOptions({ name: 'ProgressBar', inheritAttrs: false });

const props = withDefaults(defineProps<ProgressBarProps>(), { max: 100 });

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const determinate = computed(() => typeof props.value === 'number');

const pct = computed(() =>
  determinate.value ? Math.min(100, Math.max(0, ((props.value ?? 0) / props.max) * 100)) : undefined,
);

const classes = computed(() =>
  cn(
    progressTrackVariants({
      /* `size` is the 5-member `Size`; the track defines only sm/md/lg.
         Cast to the tv key type — an out-of-range value falls through to
         the tv default. */
      size: props.size as ProgressBarVariants['size'],
    }),
    attrs.class as string | undefined,
  ),
);

const fillClasses = computed(() =>
  cn(
    progressFillVariants({ tone: props.tone }),
    !determinate.value && 'w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite]',
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
  <div
    ref="el"
    role="progressbar"
    :aria-label="props.label"
    :aria-valuemin="0"
    :aria-valuemax="props.max"
    :aria-valuenow="determinate ? props.value : undefined"
    v-bind="rest"
    :class="classes"
  >
    <div :class="fillClasses" :style="determinate ? { width: `${pct}%` } : undefined" />
  </div>
</template>
