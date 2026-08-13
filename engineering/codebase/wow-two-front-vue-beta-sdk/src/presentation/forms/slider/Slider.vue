<script lang="ts">
import type { Size } from '../../../foundation/utils';

export interface SliderProps {
  /** The control size. */
  size?: Size;

  /** The value, controlled — React's spelling, which wins when both are set. */
  value?: string | number;

  /** The value, controlled. The `v-model` binding target. */
  modelValue?: string | number;

  /** The initial value when uncontrolled. */
  defaultValue?: string | number;

  /** The lower bound. Default 0. */
  min?: string | number;

  /** The upper bound. Default 100. */
  max?: string | number;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The required state. Falls back to the surrounding form control's `isRequired`. */
  required?: boolean;
}

/* Complete literal class strings — interpolating into the arbitrary variant would hide them from Tailwind's scanner.
   Sizes not listed fall back to the `md` row at the call site. */
const TRACK_CLASS: Partial<Record<Size, string>> = {
  sm: '[&::-webkit-slider-runnable-track]:h-1 [&::-moz-range-track]:h-1',
  md: '[&::-webkit-slider-runnable-track]:h-1.5 [&::-moz-range-track]:h-1.5',
  lg: '[&::-webkit-slider-runnable-track]:h-2 [&::-moz-range-track]:h-2',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Size as SizeValue } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';

/**
 * Single-value range slider — native `<input type="range">` styled across
 * browsers. Multi-thumb / range slider lives at L5.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Slider', inheritAttrs: false });

const props = withDefaults(defineProps<SliderProps>(), {
  size: SizeValue.Md,
  min: 0,
  max: 100,
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form control
     context, and Vue casts an absent `boolean` prop to `false` — which would shadow it. */
  disabled: undefined,
  required: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: string];
  /** Replaces React's `onValueChange`. Native `input` / `change` stay fallthrough listeners. */
  'value-change': [value: string];
}>();

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useFormControl();

const controlled = useControlled<string | number>({
  controlled: () => props.value ?? props.modelValue,
  default: () => props.defaultValue ?? props.min,
  onChange: (next) => {
    emit('update:modelValue', String(next));
    emit('value-change', String(next));
  },
});

const currentValue = controlled.value;

function onInput(event: Event): void {
  controlled.setValue((event.target as HTMLInputElement).value);
}

const inputId = computed(() => props.id ?? ctx?.id);
const isDisabled = computed(() => props.disabled ?? ctx?.isDisabled);
const isRequired = computed(() => props.required ?? ctx?.isRequired);
const isInvalid = computed(() => ctx?.isInvalid || undefined);
const describedBy = computed(() => ctx?.describedBy);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    'w-full appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50',
    TRACK_CLASS[props.size] ?? TRACK_CLASS.md,
    // WebKit
    '[&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-muted',
    '[&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background',
    // Firefox
    '[&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-muted',
    '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background',
    'focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-ring',
    attrs.class as ClassValue,
  ),
);

const root = useTemplateRef<HTMLInputElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <input
    ref="root"
    type="range"
    :id="inputId"
    :disabled="isDisabled"
    :required="isRequired"
    :min="min"
    :max="max"
    :value="currentValue"
    :aria-invalid="isInvalid"
    :aria-describedby="describedBy"
    :class="rootClass"
    v-bind="passthroughAttrs"
    @input="onInput"
  />
</template>
