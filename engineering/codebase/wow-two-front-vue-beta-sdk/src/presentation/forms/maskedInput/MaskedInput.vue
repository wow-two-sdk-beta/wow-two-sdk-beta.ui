<script lang="ts">
import type { InputSize, InputState } from '../InputStyles';

export interface MaskedInputProps {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  /** The mask pattern. `#` = digit, `A` = alpha, `*` = alphanumeric, anything else = literal. */
  mask: string;

  /** The value, controlled — React's spelling, which wins when both are set. */
  value?: string;

  /** The value, controlled. The `v-model` binding target. */
  modelValue?: string;

  /** The initial value when uncontrolled. */
  defaultValue?: string;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The required state. Falls back to the surrounding form control's `isRequired`. */
  required?: boolean;

  /** The read-only state — React's spelling. Falls back to the form control's `isReadOnly`. */
  readOnly?: boolean;

  /** The DOM spelling of {@link MaskedInputProps.readOnly}, which wins when both are set. */
  readonly?: boolean;
}

export function applyMask(raw: string, mask: string): string {
  /* Hardening past the React original, which read `mask.length` unguarded: `mask` is a
     required prop, but Vue only WARNS on a missing required prop and then renders, so an
     omitted mask turned every keystroke into a TypeError instead of a console warning.
     Passing the raw value through keeps the control usable while the warning still fires. */
  if (!mask) return raw;
  let out = '';
  let r = 0;
  for (let m = 0; m < mask.length && r < raw.length; m++) {
    const tok = mask[m];
    const ch = raw[r];
    if (!tok || !ch) break;
    if (tok === '#') {
      if (/[0-9]/.test(ch)) {
        out += ch;
        r++;
      } else {
        r++;
        m--;
      }
    } else if (tok === 'A') {
      if (/[A-Za-z]/.test(ch)) {
        out += ch;
        r++;
      } else {
        r++;
        m--;
      }
    } else if (tok === '*') {
      if (/[A-Za-z0-9]/.test(ch)) {
        out += ch;
        r++;
      } else {
        r++;
        m--;
      }
    } else {
      // literal
      out += tok;
      if (ch === tok) r++;
    }
  }
  return out;
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
 * Text input with a simple character-class mask. Tokens: `#` digit, `A`
 * letter, `*` alphanumeric. Anything else is a literal that's auto-inserted.
 *
 * Examples: `"###-###-####"` (US phone), `"##/##/####"` (date), `"AAA-####"`.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'MaskedInput', inheritAttrs: false });

const props = withDefaults(defineProps<MaskedInputProps>(), {
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

const controlled = useControlled<string>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? '',
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const currentValue = controlled.value;

function onInput(event: Event): void {
  controlled.setValue(applyMask((event.target as HTMLInputElement).value, props.mask));
}

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
      state: props.state ?? (ctx?.isInvalid ? InputStateValue.Invalid : InputStateValue.Default),
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
    type="text"
    :value="currentValue"
    :id="inputId"
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
