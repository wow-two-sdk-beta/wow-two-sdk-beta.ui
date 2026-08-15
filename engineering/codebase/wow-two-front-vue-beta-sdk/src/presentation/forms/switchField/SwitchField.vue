<script lang="ts">
import type { Side } from '../../../foundation/utils';
import type { SwitchProps } from '../switch';

export interface SwitchFieldProps extends SwitchProps {
  /** The label. Fill the `label` slot instead for richer content. */
  label?: string | number;

  /** The smaller helper / description below. Fill the `description` slot for richer content. */
  description?: string | number;

  /** The switch placement — on the left (default) or right of the label. */
  side?: Side;

  /**
   * The wrap-element class (the `<label>`).
   *
   * React put `className` on the inner `Switch` and `wrapperClassName` on the `<label>`;
   * that split is preserved, so Vue's `class` fallthrough attr reaches the SWITCH, not the
   * root. Style the wrapper through this prop.
   */
  wrapperClassName?: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Side as SideValue } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import Switch from '../switch/Switch.vue';

/**
 * Switch + label + optional description in a single clickable `<label>`.
 * `side="right"` is the common settings-row pattern (label left, switch right).
 */
/* `inheritAttrs: false` so `class` reaches the inner Switch (React's `className`) rather
   than landing on the `<label>`. */
defineOptions({ name: 'SwitchField', inheritAttrs: false });

const props = withDefaults(defineProps<SwitchFieldProps>(), { side: SideValue.Left });

defineSlots<{
  label?(): unknown;
  description?(): unknown;
}>();

const attrs = useAttrs();
const slots = useSlots();

const generated = useId();
/* Context id wins over the generated fallback (see CheckboxField). */
const ctx = useFormControl();
const inputId = computed(() => props.id ?? ctx?.id ?? generated);

const hasDescription = computed(() => Boolean(props.description) || Boolean(slots.description));

/* No `defineEmits`: the consumer's `v-model` listeners must stay in `useAttrs()` to reach
   the inner `Switch` — see the CheckboxField note. */
const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

/** This component's own props must not reach the inner `Switch`. */
const switchProps = computed(() => {
  const { label: _label, description: _description, side: _side, wrapperClassName: _wrapperClassName, ...rest } = props;
  return rest;
});

const wrapperClass = computed(() =>
  cn(
    'flex cursor-pointer items-start gap-3',
    props.side === SideValue.Right && 'flex-row-reverse justify-between',
    props.wrapperClassName,
  ),
);

const switchClass = computed(() => attrs.class as ClassValue);

const inner = useTemplateRef<{ el: HTMLInputElement | null }>('inner');

/** The rendered `<input>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: computed(() => inner.value?.el ?? null) });
</script>

<template>
  <label :for="inputId" :class="wrapperClass">
    <Switch ref="inner" v-bind="{ ...switchProps, ...passthroughAttrs }" :id="inputId" :class="switchClass" />
    <span class="flex flex-col gap-0.5 text-sm">
      <span class="font-medium text-foreground">
        <slot name="label">{{ label }}</slot>
      </span>
      <span v-if="hasDescription" class="text-muted-foreground">
        <slot name="description">{{ description }}</slot>
      </span>
    </span>
  </label>
</template>
