<script lang="ts">
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an
   exported name: React declared `StepperListProps` and consumers import it. Its only
   member was `children`, which is the default slot here; every attribute falls through. */
export interface StepperListProps {}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Orientation } from '../../../foundation/utils';
import { RovingFocusGroup } from '../../../foundation/primitives';
import { useStepperContext } from './StepperContext';

/** The step strip. Arrow-key navigation comes from `RovingFocusGroup`. */
defineOptions({ name: 'StepperList', inheritAttrs: false });

/** The `StepperStep` children — React's required `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();
const el = useTemplateRef<InstanceType<typeof RovingFocusGroup>>('el');
const stepper = useStepperContext();

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const listClass = computed(() =>
  cn(
    'flex',
    stepper.orientation === Orientation.Vertical ? 'flex-col gap-4' : 'flex-row items-center gap-2',
    attrs.class as ClassValue,
  ),
);

defineExpose({ el });
</script>

<template>
  <RovingFocusGroup
    ref="el"
    :orientation="stepper.orientation"
    role="tablist"
    :aria-orientation="stepper.orientation"
    :data-orientation="stepper.orientation"
    :class="listClass"
    v-bind="passthroughAttrs"
  >
    <slot />
  </RovingFocusGroup>
</template>
