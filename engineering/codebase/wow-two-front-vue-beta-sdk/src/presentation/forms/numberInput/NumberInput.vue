<script lang="ts">
import type { InputSize, InputState, InputBorder, InputRing } from '../InputStyles';

export interface NumberInputProps {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  /** The border weight. */
  border?: InputBorder;
  /** The focus-ring weight. */
  ring?: InputRing;

  /** The increment granularity of the stepper buttons and arrow keys. Default 1. */
  step?: number;

  /**
   * The value, controlled. The `v-model` binding target.
   *
   * Emitted back as the input's raw string, matching Vue's own `v-model` on a
   * native `<input type="number">`; add `.number` at the call site for a number.
   */
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

  /** The DOM spelling of {@link NumberInputProps.readOnly}, which wins when both are set. */
  readonly?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { Minus, Plus } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { inputBaseVariants, InputState as InputStateValue } from '../InputStyles';

const MinusIcon = Minus;
const PlusIcon = Plus;

/**
 * Numeric input with stepper buttons. Steppers are raw `<button>` elements
 * to keep the strict atom rule (NumberInput is L3; importing Button would
 * make this an atom-on-atom composition).
 */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. Everything else is forwarded
   onto the inner `<input>` by hand, matching React's `{...props}` placement. */
defineOptions({ name: 'NumberInput', inheritAttrs: false });

const props = withDefaults(defineProps<NumberInputProps>(), {
  step: 1,
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
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? '',
  onChange: (next) => {
    emit('update:modelValue', String(next));
    emit('value-change', String(next));
  },
});

const currentValue = controlled.value;

const root = useTemplateRef<HTMLInputElement>('root');

function onInput(event: Event): void {
  controlled.setValue((event.target as HTMLInputElement).value);
}

function adjust(direction: 1 | -1): void {
  const el = root.value;
  if (!el || typeof el.stepUp !== 'function') return;
  /* No argument — stepUp(n) steps n × the `step` attribute (already set on the input), not by n. */
  if (direction === 1) el.stepUp();
  else el.stepDown();
  /* The dispatched events drive this component's own `@input` (which re-reads `el.value`
     and fires the emits) and any fallthrough `input` / `change` listener the consumer bound. */
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

const finalState = computed(
  () => props.state ?? (ctx?.isInvalid ? InputStateValue.Invalid : InputStateValue.Default),
);

const inputId = computed(() => props.id ?? ctx?.id);
const isDisabled = computed(() => props.disabled ?? ctx?.isDisabled ?? false);
const isRequired = computed(() => props.required ?? ctx?.isRequired);
const isReadOnly = computed(() => props.readonly ?? props.readOnly ?? ctx?.isReadOnly);
const isInvalid = computed(() => ctx?.isInvalid || undefined);
const describedBy = computed(() => ctx?.describedBy);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const wrapperClass = computed(() => cn('relative', attrs.class as ClassValue));

const inputClass = computed(() =>
  cn(
    inputBaseVariants({
      size: props.size,
      state: finalState.value,
      border: props.border,
      ring: props.ring,
    }),
    'pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
  ),
);

/** The rendered `<input>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div :class="wrapperClass">
    <input
      ref="root"
      type="number"
      inputmode="decimal"
      :step="step"
      :id="inputId"
      :value="currentValue"
      :disabled="isDisabled"
      :required="isRequired"
      :readonly="isReadOnly"
      :aria-invalid="isInvalid"
      :aria-describedby="describedBy"
      :class="inputClass"
      v-bind="passthroughAttrs"
      @input="onInput"
    />
    <div class="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
      <button
        type="button"
        :disabled="isDisabled"
        aria-label="Decrement"
        class="grid h-7 w-6 place-items-center rounded text-muted-foreground hover:bg-muted disabled:opacity-50"
        @click="adjust(-1)"
      >
        <Icon :icon="MinusIcon" :size="14" />
      </button>
      <button
        type="button"
        :disabled="isDisabled"
        aria-label="Increment"
        class="grid h-7 w-6 place-items-center rounded text-muted-foreground hover:bg-muted disabled:opacity-50"
        @click="adjust(1)"
      >
        <Icon :icon="PlusIcon" :size="14" />
      </button>
    </div>
  </div>
</template>
