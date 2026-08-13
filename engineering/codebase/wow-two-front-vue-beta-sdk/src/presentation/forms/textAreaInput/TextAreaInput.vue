<script lang="ts">
import type { InputSize, InputState, InputBorder, InputRing } from '../InputStyles';

export interface TextAreaInputProps {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  /** The border weight. */
  border?: InputBorder;
  /** The focus-ring weight. */
  ring?: InputRing;

  /** The visible row count. Default 3. */
  rows?: number;

  /** The value, controlled. The `v-model` binding target. */
  modelValue?: string | number;

  /** The value, controlled — React's spelling of `modelValue`, which wins when both are set. */
  value?: string | number;

  /** The initial value when uncontrolled. */
  defaultValue?: string | number;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The required state. Falls back to the surrounding form control's `isRequired`. */
  required?: boolean;

  /** The read-only state — React's spelling. Falls back to the form control's `isReadOnly`. */
  readOnly?: boolean;

  /** The DOM spelling of {@link TextAreaInputProps.readOnly}, which wins when both are set. */
  readonly?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { inputBaseVariants, InputState as InputStateValue } from '../InputStyles';

/**
 * Multi-line text input. Inherits the input visual base. For autosize, pair
 * with a sibling-domain hook in v1 — kept simple at L3.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'TextAreaInput', inheritAttrs: false });

const props = withDefaults(defineProps<TextAreaInputProps>(), {
  rows: 3,
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form
     control context, and Vue casts an absent `boolean` prop to `false` — which would
     shadow the context with a hard "not disabled / not required / not read-only". */
  disabled: undefined,
  required: undefined,
  readOnly: undefined,
  readonly: undefined,
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
  controlled: () => props.modelValue ?? props.value,
  default: () => props.defaultValue ?? '',
  onChange: (next) => {
    emit('update:modelValue', String(next));
    emit('value-change', String(next));
  },
});

const currentValue = controlled.value;

function onInput(event: Event): void {
  controlled.setValue((event.target as HTMLTextAreaElement).value);
}

const finalState = computed(
  () => props.state ?? (ctx?.isInvalid ? InputStateValue.Invalid : InputStateValue.Default),
);

const inputId = computed(() => props.id ?? ctx?.id);
const isDisabled = computed(() => props.disabled ?? ctx?.isDisabled);
const isRequired = computed(() => props.required ?? ctx?.isRequired);
const isReadOnly = computed(() => props.readonly ?? props.readOnly ?? ctx?.isReadOnly);
const isInvalid = computed(() => ctx?.isInvalid || undefined);
const describedBy = computed(() => ctx?.describedBy);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    inputBaseVariants({
      size: props.size,
      state: finalState.value,
      border: props.border,
      ring: props.ring,
    }),
    'h-auto resize-y py-2',
    attrs.class as ClassValue,
  ),
);

const root = useTemplateRef<HTMLTextAreaElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <textarea
    ref="root"
    :rows="rows"
    :id="inputId"
    :value="currentValue"
    :disabled="isDisabled"
    :required="isRequired"
    :readonly="isReadOnly"
    :aria-invalid="isInvalid"
    :aria-describedby="describedBy"
    :class="rootClass"
    v-bind="passthroughAttrs"
    @input="onInput"
  />
</template>
