<script lang="ts">
export interface StepperPanelProps {
  /** The value this panel belongs to — pairs it with the `StepperStep` of the same value. */
  value: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useStepperContext } from './StepperContext';

/** The panel for one step. Only the active panel is mounted. */
defineOptions({ name: 'StepperPanel', inheritAttrs: false });

/** The panel content — React's required `children`. */
defineSlots<{ default(): unknown }>();

const props = defineProps<StepperPanelProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');
const stepper = useStepperContext();

const isActive = computed(() => stepper.value === props.value);

const stepId = computed(() => `${stepper.baseId}-step-${props.value}`);
const panelId = computed(() => `${stepper.baseId}-panel-${props.value}`);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const panelClass = computed(() => cn('flex-1 outline-none', attrs.class as ClassValue));

defineExpose({ el });
</script>

<template>
  <div
    v-if="isActive"
    ref="el"
    :id="panelId"
    role="tabpanel"
    :aria-labelledby="stepId"
    :tabindex="0"
    :class="panelClass"
    v-bind="passthroughAttrs"
  >
    <slot />
  </div>
</template>
