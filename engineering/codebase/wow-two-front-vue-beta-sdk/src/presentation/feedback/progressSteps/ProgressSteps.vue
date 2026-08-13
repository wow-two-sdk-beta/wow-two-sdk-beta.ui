<script lang="ts">
import type { Orientation } from '../../../foundation/utils';

export interface ProgressStepsProps {
  /** The step labels in order. */
  steps: ReadonlyArray<string>;

  /** The index of the active step (0-based). Steps before are marked complete. */
  current: number;

  /** The layout direction. Default `horizontal`. */
  orientation?: Orientation;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { Check } from 'lucide-vue-next';
import { cn, Orientation as OrientationToken } from '../../../foundation/utils';
import { Icon, type IconAdapter } from '../../../foundation/icons';

/**
 * `lucide-vue-next` types `size` as `24 | number`; `IconAdapterProps` widens it to
 * `number | string`, which makes the two functional-component types contravariantly
 * incompatible even though the runtime shape matches. Cast at the import boundary —
 * `foundation/icons` is outside this lane, and the real fix is narrowing
 * `IconAdapterProps['size']` there.
 */
const CheckIcon = Check as unknown as IconAdapter;

/**
 * Visual N-of-M progress dots / pills with connectors. No state machine —
 * the consumer drives `current`. For full wizard-with-content semantics use
 * the L5 `Stepper` organism.
 */
defineOptions({ name: 'ProgressSteps', inheritAttrs: false });

const props = withDefaults(defineProps<ProgressStepsProps>(), {
  orientation: OrientationToken.Horizontal,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLOListElement>('el');

const isHorizontal = computed(() => props.orientation === OrientationToken.Horizontal);

const classes = computed(() =>
  cn(
    'flex',
    isHorizontal.value ? 'flex-row items-center gap-2' : 'flex-col gap-3',
    attrs.class as string | undefined,
  ),
);

/** The per-index step status, driving both the marker and the connector tone. */
const statusAt = (i: number) => (i < props.current ? 'complete' : i === props.current ? 'current' : 'upcoming');

const itemClasses = (i: number) =>
  cn('flex items-center gap-2', isHorizontal.value && i < props.steps.length - 1 && 'flex-1');

const markerClasses = (i: number) => {
  const status = statusAt(i);
  return cn(
    'grid h-7 w-7 place-items-center rounded-full text-xs font-medium',
    status === 'complete' && 'bg-primary text-primary-foreground',
    status === 'current' && 'border-2 border-primary text-primary',
    status === 'upcoming' && 'border border-border text-muted-foreground',
  );
};

const labelClasses = (i: number) =>
  cn('text-sm', statusAt(i) === 'upcoming' ? 'text-muted-foreground' : 'text-foreground');

const connectorClasses = (i: number) => cn('h-px flex-1', i < props.current ? 'bg-primary' : 'bg-border');

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <ol ref="el" v-bind="rest" :class="classes">
    <li v-for="(label, i) in props.steps" :key="i" :class="itemClasses(i)">
      <span :class="markerClasses(i)" :aria-current="statusAt(i) === 'current' ? 'step' : undefined">
        <Icon v-if="statusAt(i) === 'complete'" :icon="CheckIcon" :size="14" />
        <template v-else>{{ i + 1 }}</template>
      </span>
      <span :class="labelClasses(i)">{{ label }}</span>
      <span
        v-if="isHorizontal && i < props.steps.length - 1"
        :class="connectorClasses(i)"
        aria-hidden="true"
      />
    </li>
  </ol>
</template>
