<script lang="ts">
import type { Size } from '../../../foundation/utils';

export interface RadioProps {
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
const SIZE_CLASS: Partial<Record<Size, string>> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Size as SizeValue } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';

/**
 * Native radio button with custom visual. Use multiple with the same `name`
 * to form a mutually exclusive group; for arrow-key nav, wrap in
 * `RadioGroup` (L4).
 */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Radio', inheritAttrs: false });

const props = withDefaults(defineProps<RadioProps>(), {
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
  controlled: () => (props.checked !== undefined ? props.checked : props.modelValue),
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
    SIZE_CLASS[props.size] ?? SIZE_CLASS.md,
    attrs.class as ClassValue,
  ),
);

const visualClass = cn(
  'pointer-events-none grid h-full w-full place-items-center rounded-full border border-input bg-background transition-colors',
  'peer-checked:border-primary',
  /* Dot opacity gate lives on this span (a peer sibling of the input) — child-selector targets the dot. peer-checked: cannot reach descendants directly. */
  '[&>span]:opacity-0 peer-checked:[&>span]:opacity-100',
  'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
  'peer-disabled:opacity-50',
);

const input = useTemplateRef<HTMLInputElement>('input');

/** The rendered `<input>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: input });
</script>

<template>
  <span :class="wrapperClass">
    <input
      ref="input"
      type="radio"
      :id="inputId"
      :disabled="isDisabled"
      :required="isRequired"
      :checked="isChecked"
      :aria-invalid="isInvalid"
      class="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      v-bind="passthroughAttrs"
      @change="onChange"
    />
    <span aria-hidden="true" :class="visualClass">
      <span class="h-2 w-2 rounded-full bg-primary" />
    </span>
  </span>
</template>
