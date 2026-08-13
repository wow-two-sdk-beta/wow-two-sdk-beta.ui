<script lang="ts">
import type { Orientation } from '../../../foundation/utils';

export interface StepperProps {
  /** The active step value, controlled — React's spelling, which wins when both are set. */
  value?: string;

  /** The active step value, controlled. The `v-model` binding target. */
  modelValue?: string;

  /** The initial active step value when uncontrolled. */
  defaultValue?: string;

  /** The layout axis. Default `horizontal`. */
  orientation?: Orientation;
}
</script>

<script setup lang="ts">
import { computed, provide, ref, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Orientation as OrientationValue } from '../../../foundation/utils';
import { useControlled, useId } from '../../../foundation/hooks';
import { StepperKey, type StepperContextValue } from './StepperContext';

/**
 * Stepper root. Owns the active value and publishes it to `StepperList` /
 * `StepperStep` / `StepperPanel` through injection — React attached those as
 * `Stepper.List` / `.Step` / `.Panel` statics, which an SFC's default export
 * cannot carry.
 */
/* `inheritAttrs: false` so `class` folds into the root's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Stepper', inheritAttrs: false });

/** The step list and panels — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<StepperProps>(), {
  orientation: OrientationValue.Horizontal,
  /* Explicit `undefined` defaults: `useControlled` keys on `=== undefined`. */
  value: undefined,
  modelValue: undefined,
  defaultValue: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: string];
  /** Replaces React's `onValueChange`. */
  'value-change': [value: string];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const controlled = useControlled<string>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? '',
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const active = controlled.value;
const baseId = useId();

/* Reactive, unlike React's `useRef` array: `StepperStep` derives its status and its connector
   visibility from this list at render time, so a sibling registering has to re-render it. */
const steps = ref<Array<string>>([]);

function registerStep(value: string): void {
  if (!steps.value.includes(value)) steps.value = [...steps.value, value];
}

function unregisterStep(value: string): void {
  steps.value = steps.value.filter((x) => x !== value);
}

/* Live getters, not a snapshot — an orientation change on the root has to reach every
   already-mounted step. */
provide<StepperContextValue>(StepperKey, {
  get value() {
    return active.value;
  },
  setValue: controlled.setValue,
  get orientation() {
    return props.orientation;
  },
  baseId,
  get steps() {
    return steps.value;
  },
  registerStep,
  unregisterStep,
});

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    props.orientation === OrientationValue.Vertical ? 'flex gap-4' : 'flex flex-col gap-4',
    attrs.class as ClassValue,
  ),
);

/** The rendered root `<div>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el });
</script>

<template>
  <div ref="el" :data-orientation="orientation" :class="rootClass" v-bind="passthroughAttrs">
    <slot />
  </div>
</template>
