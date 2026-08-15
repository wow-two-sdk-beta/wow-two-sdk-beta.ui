<script lang="ts">
/* `Align` is imported here (not in `<script setup>`) so the one binding serves
   as both the type below and the runtime value used in `withDefaults`. */
import { Align } from '../../../foundation/utils';

export interface ClusterProps {
  /** The gap between children. Default `4`. */
  gap?: '2' | '3' | '4' | '6' | '8';

  /** The cross-axis justification. Default `center`. */
  justify?: Align;
}

const GAP: Record<NonNullable<ClusterProps['gap']>, string> = {
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
};
const JUSTIFY: Record<NonNullable<ClusterProps['justify']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * Centered wrapping row — for auth-page action clusters, hero CTAs, footer
 * link groups. `Inline` left-aligns; `Cluster` centers by default.
 */
defineOptions({ name: 'Cluster', inheritAttrs: false });

const props = withDefaults(defineProps<ClusterProps>(), { gap: '4', justify: Align.Center });

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const classes = computed(() =>
  cn('flex flex-wrap items-center', GAP[props.gap], JUSTIFY[props.justify], attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div ref="el" v-bind="rest" :class="classes"><slot /></div>
</template>
