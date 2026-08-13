<script lang="ts">
import type { InputSize, InputState } from '../InputStyles';

export interface PasswordInputProps {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  /** The visibility-toggle button's presence. Default true. */
  hasToggle?: boolean;

  /** The value, controlled — React's spelling, which wins when both are set. */
  value?: string | number;

  /** The value, controlled. The `v-model` binding target. */
  modelValue?: string | number;

  /** The initial value when uncontrolled. */
  defaultValue?: string | number;

  /** The autofill hint. React defaulted this to `current-password`; so does the port. */
  autocomplete?: string;

  /** React's spelling of {@link PasswordInputProps.autocomplete}; the DOM spelling wins. */
  autoComplete?: string;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The required state. Falls back to the surrounding form control's `isRequired`. */
  required?: boolean;

  /** The read-only state — React's spelling. Falls back to the form control's `isReadOnly`. */
  readOnly?: boolean;

  /** The DOM spelling of {@link PasswordInputProps.readOnly}, which wins when both are set. */
  readonly?: boolean;
}
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { Eye, EyeOff } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { inputBaseVariants, InputState as InputStateValue } from '../InputStyles';

/**
 * Password input with optional visibility toggle. Toggle is a raw `<button>`
 * to keep the strict atom rule.
 */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'PasswordInput', inheritAttrs: false });

const props = withDefaults(defineProps<PasswordInputProps>(), {
  hasToggle: true,
  autocomplete: undefined,
  autoComplete: undefined,
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form control
     context, and Vue casts an absent `boolean` prop to `false` — which would shadow it. */
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
  controlled: () => props.value ?? props.modelValue,
  default: () => props.defaultValue ?? '',
  onChange: (next) => {
    emit('update:modelValue', String(next));
    emit('value-change', String(next));
  },
});

const currentValue = controlled.value;

function onInput(event: Event): void {
  controlled.setValue((event.target as HTMLInputElement).value);
}

const visible = ref(false);

function toggle(): void {
  visible.value = !visible.value;
}

const inputType = computed(() => (visible.value ? 'text' : 'password'));
const toggleLabel = computed(() => (visible.value ? 'Hide password' : 'Show password'));
const toggleIcon = computed(() => (visible.value ? EyeOff : Eye));

const autocompleteValue = computed(
  () => props.autocomplete ?? props.autoComplete ?? 'current-password',
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
      state:
        props.state ?? (ctx?.isInvalid ? InputStateValue.Invalid : InputStateValue.Default),
    }),
    props.hasToggle && 'pr-10',
  ),
);

const input = useTemplateRef<HTMLInputElement>('input');

/** The rendered `<input>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: input });
</script>

<template>
  <div :class="wrapperClass">
    <input
      ref="input"
      :type="inputType"
      :autocomplete="autocompleteValue"
      :spellcheck="false"
      :id="inputId"
      :disabled="isDisabled"
      :required="isRequired"
      :readonly="isReadOnly"
      :value="currentValue"
      :aria-invalid="isInvalid"
      :aria-describedby="describedBy"
      :class="inputClass"
      v-bind="passthroughAttrs"
      @input="onInput"
    />
    <button
      v-if="hasToggle"
      type="button"
      :disabled="isDisabled"
      :aria-label="toggleLabel"
      :aria-pressed="visible"
      class="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-muted disabled:opacity-50"
      @click="toggle"
    >
      <Icon :icon="toggleIcon" :size="16" />
    </button>
  </div>
</template>
