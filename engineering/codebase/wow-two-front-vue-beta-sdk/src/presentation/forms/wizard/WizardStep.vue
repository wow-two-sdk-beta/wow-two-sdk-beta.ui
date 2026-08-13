<script lang="ts">
export interface WizardStepProps {
  /** The step id — the value `currentStep` takes when this step is active. */
  id: string;

  /** The step-strip label. Defaults to the id. */
  label?: string | number;

  /**
   * The gate run before advancing off this step. Resolving `false` blocks the move.
   *
   * Kept a PROP, not an emit: it RETURNS a verdict (possibly a promise), which an emit
   * cannot do.
   */
  validate?: () => boolean | Promise<boolean>;

  /** Whether the step strip marks this step `(optional)`. */
  isOptional?: boolean;

  /** Whether this is the last step — Next becomes the submit action. */
  isFinal?: boolean;
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, useAttrs, useTemplateRef, watch } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useWizard } from './WizardContext';

/** One wizard panel. Registers its metadata and validator; renders only while active. */
defineOptions({ name: 'WizardStep', inheritAttrs: false });

/** The panel content — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = defineProps<WizardStepProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useWizard();

const isCurrent = computed(() => ctx.currentStep?.id === props.id);

/* Register / refresh step metadata. `immediate` so the step is in the registry from mount —
   nothing here touches the DOM, so it is safe during SSR. */
watch(
  () => ({
    id: props.id,
    label: props.label,
    isOptional: props.isOptional,
    isFinal: props.isFinal,
  }),
  (info) => ctx.registerStep(info),
  { immediate: true, deep: true },
);

watch(
  [() => props.id, () => props.validate],
  ([id, validate]) => {
    if (validate) ctx.registerValidator(id, validate);
    else ctx.unregisterValidator(id);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  ctx.unregisterStep(props.id);
  ctx.unregisterValidator(props.id);
});

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const panelClass = computed(() => cn('flex flex-col gap-3', attrs.class as ClassValue));

const labelledBy = computed(() => `wizard-step-${props.id}`);

defineExpose({ el });
</script>

<template>
  <div
    v-if="isCurrent"
    ref="el"
    role="tabpanel"
    :aria-labelledby="labelledBy"
    :class="panelClass"
    v-bind="passthroughAttrs"
  >
    <slot />
  </div>
</template>
