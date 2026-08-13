<script lang="ts">
export interface KeyboardShortcutPickerProps {
  /** The captured chord, controlled — React's spelling, which wins when both are set. */
  value?: ReadonlyArray<string>;

  /** The captured chord, controlled. The `v-model` binding target. */
  modelValue?: ReadonlyArray<string>;

  /** The initial chord when uncontrolled. */
  defaultValue?: ReadonlyArray<string>;

  /** The idle label. Fill the `placeholder` slot for richer content. */
  placeholder?: string | number;

  /** The listening label. Fill the `recordLabel` slot for richer content. */
  recordLabel?: string | number;

  /** The hidden input name; the hidden input emits the `+`-joined chord. */
  name?: string;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;
}

// SSR-safe: `navigator` is undefined in Node < 21.
const IS_MAC =
  typeof navigator !== 'undefined' && navigator.platform?.toLowerCase().includes('mac');

const MODIFIER_NAMES: Record<string, string> = {
  Control: 'Ctrl',
  Meta: IS_MAC ? '⌘' : 'Meta',
  Alt: 'Alt',
  Shift: 'Shift',
};

function isModifier(key: string): boolean {
  return ['Control', 'Meta', 'Alt', 'Shift'].includes(key);
}

function normalizeKey(key: string): string {
  if (key === ' ') return 'Space';
  if (key.length === 1) return key.toUpperCase();
  return key;
}
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled, useEventListener } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import Kbd from '../../display/kbd/Kbd.vue';

/**
 * Capture a key chord. Click record → press keys → captured. Escape cancels;
 * Backspace during listening clears. Output is a normalized name array
 * (e.g. `['Meta', 'Shift', 'K']`).
 */
/* `inheritAttrs: false` so `class` folds into the button's own `cn()` call, and so the rest of
   the attrs land on the button rather than being dropped by the multi-root template. */
defineOptions({ name: 'KeyboardShortcutPicker', inheritAttrs: false });

const props = withDefaults(defineProps<KeyboardShortcutPickerProps>(), {
  placeholder: 'Click to record',
  recordLabel: 'Press keys…',
  /* Explicit `undefined` defaults: `useControlled` keys on `=== undefined`, and Vue casts an
     absent `boolean` prop to `false` — which would shadow the form control context. */
  value: undefined,
  modelValue: undefined,
  disabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [keys: ReadonlyArray<string>];
  /** Replaces React's `onValueChange`. */
  'value-change': [keys: ReadonlyArray<string>];
}>();

defineSlots<{
  placeholder?(): unknown;
  recordLabel?(): unknown;
}>();

const attrs = useAttrs();

/* Inherits id/disabled/invalid/labelledby/describedby from a surrounding <Field>;
   standalone props win when provided, context fills the gaps (Select parity). */
const field = useFormControl();
const finalDisabled = computed(() => props.disabled ?? field?.isDisabled);

const controlled = useControlled<ReadonlyArray<string>>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? [],
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const keys = controlled.value;
const recording = ref(false);
const button = useTemplateRef<HTMLButtonElement>('button');

/* Never declared props — a declared `'aria-label'` would arrive as `props.ariaLabel` and stop
   reaching the DOM. Read off the attrs so the consumer's value can override the context's. */
const ariaLabel = computed(() => attrs['aria-label'] as string | undefined);
const ariaLabelledBy = computed(() => attrs['aria-labelledby'] as string | undefined);
const ariaDescribedBy = computed(() => attrs['aria-describedby'] as string | undefined);

/* The document listeners are attached only while recording: the target getter returns `null`
   otherwise, which is what detaches them. `useEventListener` is post-flush and guards
   `typeof document`, so nothing here reaches the DOM during SSR. */
const listenerTarget = computed<Document | null>(() => {
  if (!recording.value) return null;
  return typeof document === 'undefined' ? null : document;
});

useEventListener(
  'keydown',
  (event) => {
    const e = event as KeyboardEvent;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') {
      recording.value = false;
      return;
    }
    if (e.key === 'Backspace') {
      controlled.setValue([]);
      recording.value = false;
      return;
    }
    if (isModifier(e.key)) return;
    const captured: Array<string> = [];
    if (e.metaKey) captured.push('Meta');
    if (e.ctrlKey) captured.push('Control');
    if (e.altKey) captured.push('Alt');
    if (e.shiftKey) captured.push('Shift');
    captured.push(normalizeKey(e.key));
    controlled.setValue(captured);
    recording.value = false;
  },
  listenerTarget,
  true,
);

useEventListener(
  'pointerdown',
  (event) => {
    const target = (event as MouseEvent).target as Node | null;
    if (button.value && target && !button.value.contains(target)) recording.value = false;
  },
  listenerTarget,
);

function startRecord(): void {
  if (finalDisabled.value) return;
  recording.value = true;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  if (recording.value) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    startRecord();
  }
}

function modifierLabel(key: string): string {
  return MODIFIER_NAMES[key] ?? key;
}

const buttonId = computed(() => props.id ?? field?.id);
/* Names the trigger from the Field label when present; an explicit aria-label always wins. */
const labelledBy = computed(
  () => ariaLabelledBy.value ?? (ariaLabel.value ? undefined : field?.labelledBy),
);
const describedBy = computed(() => ariaDescribedBy.value ?? field?.describedBy);
const hiddenValue = computed(() => keys.value.join('+'));

const OWNED_ATTRS: ReadonlySet<string> = new Set([
  'class',
  'aria-labelledby',
  'aria-describedby',
]);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const buttonClass = computed(() =>
  cn(
    'inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
    recording.value && 'border-primary bg-primary-soft text-primary-soft-foreground',
    attrs.class as ClassValue,
  ),
);

/** The rendered `<button>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: button });
</script>

<template>
  <button
    ref="button"
    type="button"
    :id="buttonId"
    :aria-pressed="recording"
    :aria-invalid="field?.isInvalid || undefined"
    :aria-labelledby="labelledBy"
    :aria-describedby="describedBy"
    :disabled="finalDisabled"
    :class="buttonClass"
    v-bind="passthroughAttrs"
    @click="startRecord"
    @keydown="onKeydown"
  >
    <span v-if="recording" class="text-xs text-muted-foreground">
      <slot name="recordLabel">{{ recordLabel }}</slot>
    </span>
    <span v-else-if="keys.length === 0" class="text-xs text-muted-foreground">
      <slot name="placeholder">{{ placeholder }}</slot>
    </span>
    <span v-else class="inline-flex items-center gap-1 text-muted-foreground">
      <template v-for="(k, i) in keys" :key="i">
        <span v-if="i > 0" aria-hidden="true">+</span>
        <Kbd>{{ modifierLabel(k) }}</Kbd>
      </template>
    </span>
  </button>
  <input v-if="name" type="hidden" :name="name" :value="hiddenValue" />
</template>
