<script lang="ts">
import type { Size } from '../../../foundation/styles';

export interface MeterBarProps {
  /** The current value 0–`max`. */
  readonly value: number;
  readonly max?: number;
  /** The threshold values that change the fill tone. Pass `[good, warn]` —
   *  `value <= good` → success, `<= warn` → warning, otherwise destructive.
   *  Defaults: `[max * 0.7, max * 0.9]`. */
  readonly thresholds?: [number, number];

  /** The bar thickness. */
  readonly size?: Size;
  readonly label?: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn, Size as SizeToken } from '../../../foundation/styles';

/* Only the sm/md/lg steps carry a thickness; other `Size` members fall through
   to the `md` default at the lookup below. */
const TrackHeight: Partial<Record<Size, string>> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

/**
 * Renders a horizontal gauge whose fill color crosses threshold zones — green / amber / red.
 * Use for usage gauges, capacity, and score meters; `ProgressBar` covers plain progress.
 */
defineOptions({ name: 'MeterBar', inheritAttrs: false });

const props = withDefaults(defineProps<MeterBarProps>(), { max: 100, size: SizeToken.Md });

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const tone = computed(() => {
  const [good, warn] = props.thresholds ?? [props.max * 0.7, props.max * 0.9];
  return props.value <= good ? 'bg-success' : props.value <= warn ? 'bg-warning' : 'bg-destructive';
});

const pct = computed(() => Math.min(100, Math.max(0, (props.value / props.max) * 100)));

const classes = computed(() =>
  cn(
    'w-full overflow-hidden rounded-full bg-muted',
    TrackHeight[props.size] ?? TrackHeight.md,
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
  <div
    ref="el"
    role="meter"
    :aria-label="props.label"
    :aria-valuemin="0"
    :aria-valuemax="props.max"
    :aria-valuenow="props.value"
    v-bind="rest"
    :class="classes"
  >
    <div :class="cn('h-full rounded-full transition-[width] duration-300', tone)" :style="{ width: `${pct}%` }" />
  </div>
</template>
