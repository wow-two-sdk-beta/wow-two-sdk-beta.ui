<script lang="ts">
import type { Temporal } from 'temporal-polyfill';
import type { InputSize, InputState, InputBorder, InputRing } from '../InputStyles';

export interface DateFieldProps {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  /** The border weight. */
  border?: InputBorder;
  /** The focus-ring weight. */
  ring?: InputRing;

  /** The value, controlled. The `v-model` binding target. `null` is the cleared state. */
  modelValue?: Temporal.PlainDate | null;

  /** The value, controlled — React's spelling of `modelValue`, which wins when both are set. */
  value?: Temporal.PlainDate | null;

  /** The initial value when uncontrolled. */
  defaultValue?: Temporal.PlainDate | null;

  /** The earliest selectable date. */
  min?: Temporal.PlainDate | null;

  /** The latest selectable date. */
  max?: Temporal.PlainDate | null;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The required state. Falls back to the surrounding form control's `isRequired`. */
  required?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { inputBaseVariants, InputState as InputStateValue } from '../InputStyles';
import { formatISODate, parseISODate } from '../DateExtensions';

/**
 * Atomic date input — wraps `<input type="date">` with our styling. Accepts and
 * emits `Temporal.PlainDate`, doing `PlainDate ↔ ISO string` conversion under the hood.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'DateField', inheritAttrs: false });

const props = withDefaults(defineProps<DateFieldProps>(), {
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form
     control context, and Vue casts an absent `boolean` prop to `false` — which would
     shadow the context with a hard "not disabled / not required". */
  disabled: undefined,
  required: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: Temporal.PlainDate | null];
  /** Replaces React's `onValueChange`. Native `input` / `change` stay fallthrough listeners. */
  'value-change': [value: Temporal.PlainDate | null];
}>();

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useFormControl();

const controlled = useControlled<Temporal.PlainDate | null>({
  controlled: () => props.modelValue ?? props.value,
  default: () => props.defaultValue ?? null,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const displayValue = computed(() => formatISODate(controlled.value.value));
const minValue = computed(() => formatISODate(props.min));
const maxValue = computed(() => formatISODate(props.max));

function onInput(event: Event): void {
  controlled.setValue(parseISODate((event.target as HTMLInputElement).value));
}

const finalState = computed(
  () => props.state ?? (ctx?.isInvalid ? InputStateValue.Invalid : InputStateValue.Default),
);

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
    inputBaseVariants({
      size: props.size,
      state: finalState.value,
      border: props.border,
      ring: props.ring,
    }),
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
    type="date"
    :id="inputId"
    :value="displayValue"
    :min="minValue"
    :max="maxValue"
    :disabled="isDisabled"
    :required="isRequired"
    :aria-invalid="isInvalid"
    :aria-describedby="describedBy"
    :class="rootClass"
    v-bind="passthroughAttrs"
    @input="onInput"
  />
</template>
