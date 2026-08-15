<script lang="ts">
import type { InputSize, InputState, InputBorder, InputRing } from '../InputStyles';
import type { SwatchShape } from '../colorSwatch';

export interface ColorFieldProps {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  /** The border weight. */
  border?: InputBorder;
  /** The focus-ring weight. */
  ring?: InputRing;

  /** The committed hex, controlled — React's spelling, which wins when both are set. */
  value?: string | null;

  /** The committed hex, controlled. The `v-model` binding target. */
  modelValue?: string | null;

  /** The initial hex when uncontrolled. */
  defaultValue?: string | null;

  /** The swatch outline shape shown inside the field. */
  swatchShape?: SwatchShape;

  /** Whether a committed hex keeps its alpha channel (`#RRGGBBAA`). */
  hasAlpha?: boolean;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The required state. Falls back to the surrounding form control's `isRequired`. */
  required?: boolean;
}
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef, watch } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { inputBaseVariants, InputState as InputStateValue } from '../InputStyles';
import { formatHex, parseHex } from '../ColorExtensions';
import ColorSwatch from '../colorSwatch/ColorSwatch.vue';
import { SwatchShape as SwatchShapeValue } from '../colorSwatch';

/**
 * Hex text field with a live swatch adornment. The draft text is free-form while
 * typing and only commits on blur / Enter — an unparseable draft reverts.
 */
/* `inheritAttrs: false` so `class` folds into the input's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'ColorField', inheritAttrs: false });

const props = withDefaults(defineProps<ColorFieldProps>(), {
  swatchShape: SwatchShapeValue.Square,
  hasAlpha: false,
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form control
     context, and Vue casts an absent `boolean` prop to `false` — which would shadow the
     context with a hard "not disabled / not required". */
  disabled: undefined,
  required: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: string | null];
  /** Replaces React's `onValueChange`. Native `input` / `change` / `blur` / `keydown` stay fallthrough. */
  'value-change': [value: string | null];
}>();

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useFormControl();

const controlled = useControlled<string | null>({
  /* `??` is wrong here — `null` is a MEANINGFUL committed value ("no color"), and `??` would
     fall through it to `modelValue`. Only `undefined` means "not controlled". */
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? null,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const committed = controlled.value;

/** The in-flight text — free-form while typing, reconciled with `committed` on commit. */
const draft = ref<string>(committed.value ?? '');

/* Syncs the draft when the committed value changes from the outside. */
watch(committed, (next) => {
  draft.value = next ?? '';
});

function commitHex(text: string, hasAlpha: boolean): string | null {
  const normalised = text.startsWith('#') ? text : `#${text}`;
  const rgb = parseHex(normalised);
  if (!rgb) return null;
  return formatHex(rgb, { withAlpha: hasAlpha });
}

function commit(): void {
  if (!draft.value) {
    controlled.setValue(null);
    return;
  }
  const next = commitHex(draft.value, props.hasAlpha);
  if (next) {
    controlled.setValue(next);
    draft.value = next;
  } else {
    /* Invalid — revert. */
    draft.value = committed.value ?? '';
  }
}

function onInput(event: Event): void {
  draft.value = (event.target as HTMLInputElement).value;
}

/* Runs after any caller-supplied `@blur` (declared after `v-bind`), exactly as React's
   `onBlur?.(e)` ran before `commit()`. React did not gate this one on `defaultPrevented`. */
function onBlur(): void {
  commit();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    commit();
  }
}

const swatchColor = computed(() => committed.value ?? '#00000000');

const inputId = computed(() => props.id ?? ctx?.id);
const isDisabled = computed(() => props.disabled ?? ctx?.isDisabled);
const isRequired = computed(() => props.required ?? ctx?.isRequired);
const isInvalid = computed(() => ctx?.isInvalid || undefined);
const describedBy = computed(() => ctx?.describedBy);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const inputClass = computed(() =>
  cn(
    inputBaseVariants({
      size: props.size,
      state: props.state ?? (ctx?.isInvalid ? InputStateValue.Invalid : InputStateValue.Default),
      border: props.border,
      ring: props.ring,
    }),
    'pl-9 font-mono uppercase',
    attrs.class as ClassValue,
  ),
);

const root = useTemplateRef<HTMLInputElement>('root');

/** The rendered `<input>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div class="relative inline-flex w-full items-stretch">
    <span class="pointer-events-none absolute inset-y-0 left-2 flex items-center">
      <ColorSwatch :color="swatchColor" size="sm" :shape="swatchShape" />
    </span>
    <input
      ref="root"
      type="text"
      :id="inputId"
      :disabled="isDisabled"
      :required="isRequired"
      :aria-invalid="isInvalid"
      :aria-describedby="describedBy"
      :spellcheck="false"
      autocapitalize="none"
      autocorrect="off"
      :value="draft"
      :class="inputClass"
      v-bind="passthroughAttrs"
      @input="onInput"
      @blur="onBlur"
      @keydown="onKeydown"
    />
  </div>
</template>
