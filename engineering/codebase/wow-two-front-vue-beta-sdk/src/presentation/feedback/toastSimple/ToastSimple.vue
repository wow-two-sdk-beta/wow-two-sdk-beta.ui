<script lang="ts">
import type { Severity } from '../../../foundation/utils';

/** Represents the prop surface of `ToastSimple`. */
export interface ToastSimpleProps {
  /** The semantic severity palette. */
  severity?: Severity;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn, surfaceVariants } from '../../../foundation/utils';
import type { Tone } from '../../../foundation/utils';
import type { ToastSimpleVariants } from './ToastSimple.variants';

/** Maps the toast `severity` keyword to a SurfaceStyles `tone`. */
const SEVERITY_TO_TONE: Record<NonNullable<ToastSimpleVariants['severity']>, Tone> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  neutral: 'neutral',
};

/**
 * Provides the atomic toast card — single tone-driven notification with free-form children.
 *
 * `role="status"` + `aria-live="polite"` are the live-region contract; `role` is
 * bound before `v-bind="rest"` so a caller-supplied `role` still wins.
 */
defineOptions({ name: 'ToastSimple', inheritAttrs: false });

const props = withDefaults(defineProps<ToastSimpleProps>(), { severity: 'neutral' });

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const classes = computed(() =>
  cn(
    'pointer-events-auto text-sm',
    surfaceVariants({
      variant: 'surface',
      tone: SEVERITY_TO_TONE[props.severity],
      radius: 'md',
      padding: 'md',
      elevation: 3,
    }),
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
  <div ref="el" role="status" aria-live="polite" v-bind="rest" :class="classes"><slot /></div>
</template>
