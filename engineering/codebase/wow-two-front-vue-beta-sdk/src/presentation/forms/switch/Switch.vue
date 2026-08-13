<script lang="ts">
import type { Size } from '../../../foundation/utils';

export interface SwitchProps {
  /** The control size. */
  size?: Size;

  /** The checked state, controlled — React's spelling, which wins when both are set. */
  checked?: boolean;

  /** The checked state, controlled. The `v-model` binding target. */
  modelValue?: boolean;

  /** The initial checked state when uncontrolled. */
  defaultChecked?: boolean;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The required state. Falls back to the surrounding form control's `isRequired`. */
  required?: boolean;
}

/* Sizes not listed fall back to the `md` row at the call site. */
const TRACK_CLASS: Partial<Record<Size, string>> = {
  sm: 'h-4 w-7',
  md: 'h-5 w-9',
  lg: 'h-6 w-11',
};
const THUMB_CLASS: Partial<Record<Size, string>> = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};
/* Thumb slide lives on the track (a peer sibling of the input) — child-selector targets the thumb. peer-checked: cannot reach descendants directly. */
const TRACK_CHECKED_CLASS: Partial<Record<Size, string>> = {
  sm: 'peer-checked:[&>span]:translate-x-3',
  md: 'peer-checked:[&>span]:translate-x-4',
  lg: 'peer-checked:[&>span]:translate-x-5',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Size as SizeValue } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';

/**
 * Toggle switch — native checkbox styled as an iOS-style track + thumb.
 * Strict atom: no built-in label; pair via `FormControl` or wrap manually.
 */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Switch', inheritAttrs: false });

const props = withDefaults(defineProps<SwitchProps>(), {
  size: SizeValue.Md,
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form control
     context, and Vue casts an absent `boolean` prop to `false` — which would shadow it. */
  checked: undefined,
  modelValue: undefined,
  defaultChecked: undefined,
  disabled: undefined,
  required: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [checked: boolean];
  /** Replaces React's `onCheckedChange`. Native `change` / `input` stay fallthrough. */
  'value-change': [checked: boolean];
}>();

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useFormControl();

const controlled = useControlled<boolean>({
  controlled: () => props.checked ?? props.modelValue,
  default: () => props.defaultChecked ?? false,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const isChecked = controlled.value;

function onChange(event: Event): void {
  controlled.setValue((event.target as HTMLInputElement).checked);
}

const inputId = computed(() => props.id ?? ctx?.id);
const isDisabled = computed(() => props.disabled ?? ctx?.isDisabled);
const isRequired = computed(() => props.required ?? ctx?.isRequired);
const isInvalid = computed(() => ctx?.isInvalid || undefined);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const wrapperClass = computed(() =>
  cn(
    'relative inline-flex shrink-0',
    TRACK_CLASS[props.size] ?? TRACK_CLASS.md,
    attrs.class as ClassValue,
  ),
);

const trackClass = computed(() =>
  cn(
    'pointer-events-none flex h-full w-full items-center rounded-full bg-input px-0.5 transition-colors',
    'peer-checked:bg-primary',
    TRACK_CHECKED_CLASS[props.size] ?? TRACK_CHECKED_CLASS.md,
    'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
    'peer-disabled:opacity-50',
  ),
);

const thumbClass = computed(() =>
  cn(
    'rounded-full bg-background shadow-sm transition-transform duration-150',
    THUMB_CLASS[props.size] ?? THUMB_CLASS.md,
  ),
);

const input = useTemplateRef<HTMLInputElement>('input');

/** The rendered `<input>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: input });
</script>

<template>
  <span :class="wrapperClass">
    <input
      ref="input"
      type="checkbox"
      role="switch"
      :id="inputId"
      :disabled="isDisabled"
      :required="isRequired"
      :checked="isChecked"
      :aria-invalid="isInvalid"
      class="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      v-bind="passthroughAttrs"
      @change="onChange"
    />
    <span aria-hidden="true" :class="trackClass">
      <span :class="thumbClass" />
    </span>
  </span>
</template>
