<script lang="ts">
export interface ComboboxPickerProps {
  /** The selected value, controlled. The `v-model` binding target. */
  readonly modelValue?: string;

  /** The initial selected value when uncontrolled. */
  readonly defaultValue?: string;

  /** The typed text, controlled. The `v-model:input-value` binding target. */
  readonly inputValue?: string;

  /** The initial typed text when uncontrolled. */
  readonly defaultInputValue?: string;

  /** The disabled state. Default `false`. */
  readonly isDisabled?: boolean;

  /** The invalid surface flag handed to `ComboboxPickerInput`. */
  readonly isInvalid?: boolean;

  /** The hidden input name; the hidden input emits the selected value. */
  readonly name?: string;

  /** The initial open state of the panel when uncontrolled. */
  readonly defaultOpen?: boolean;

  /** The panel open state, controlled. The `v-model:open` binding target. */
  readonly open?: boolean;

  /** The fill-on-select behavior — when the user picks an item, set the input value to its label. Default true. */
  readonly fillInputOnSelect?: boolean;
}
</script>

<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { useNativeFormReset } from '../UseNativeFormReset';
import { computed, provide, ref, shallowRef } from 'vue';
import { useControlled } from '../../../foundation/state';
import { useId } from '../../../foundation/identifiers';
import {
  comboboxContextKey,
  type ComboboxPickerContextValue,
  type ComboboxPickerItemEntry,
} from './ComboboxPickerContext';

/** Renders a type-to-filter picker — the input and panel children, plus the hidden input carrying the value. */
defineOptions({ name: 'ComboboxPicker', inheritAttrs: false });

/** The ComboboxPicker tree — `ComboboxPickerInput` and `ComboboxPickerContent`. React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<ComboboxPickerProps>(), {
  isDisabled: false,
  defaultOpen: false,
  fillInputOnSelect: true,
  /* Explicit `undefined` defaults are load-bearing: `useControlled` keys on `=== undefined`,
     and Vue casts an absent `boolean` prop to `false` — without these, `open` would
     read as "controlled, and closed", pinning the panel shut and making `defaultOpen` dead. */
  modelValue: undefined,
  inputValue: undefined,
  open: undefined,
  isInvalid: undefined,
});

const emit = defineEmits<{
  /** Fires when the reader commits an option by click or Enter — the `v-model` half. */
  'update:modelValue': [value: string];
  /** Fires when the reader types in the box, or a pick refills it — the `v-model:input-value` half. */
  'update:inputValue': [input: string];
  /** Fires when the reader opens or dismisses the option panel — the `v-model:open` half. */
  'update:open': [open: boolean];
}>();

const openCtl = useControlled<boolean>({
  controlled: () => props.open,
  default: () => props.defaultOpen,
  onChange: (next) => {
    emit('update:open', next);
  },
});

const valueCtl = useControlled<string>({
  controlled: () => props.modelValue,
  default: () => props.defaultValue ?? '',
  onChange: (next) => {
    emit('update:modelValue', next);
  },
});

const inputCtl = useControlled<string>({
  controlled: () => props.inputValue,
  default: () => props.defaultInputValue ?? '',
  onChange: (next) => {
    emit('update:inputValue', next);
  },
});

/* Reactive, unlike React's `useRef` array: `ComboboxPickerContent` re-clamps the active id off this
   set whenever an item registers or unregisters (filtering), which a plain ref never triggered. */
const items = ref<Array<ComboboxPickerItemEntry>>([]);
const activeId = ref<string | null>(null);
const inputEl = shallowRef<HTMLInputElement | null>(null);
const contentEl = shallowRef<HTMLElement | null>(null);
const listboxId = useId('combobox-listbox');

function registerItem(entry: ComboboxPickerItemEntry): void {
  const idx = items.value.findIndex((i) => i.id === entry.id);
  if (idx >= 0) {
    const existing = items.value[idx];
    if (
      existing &&
      existing.value === entry.value &&
      existing.label === entry.label &&
      existing.isDisabled === entry.isDisabled
    ) {
      return;
    }
    const next = items.value.slice();
    next[idx] = entry;
    items.value = next;
    return;
  }
  items.value = [...items.value, entry];
}

function unregisterItem(id: string): void {
  const idx = items.value.findIndex((i) => i.id === id);
  if (idx === -1) return;
  const next = items.value.slice();
  next.splice(idx, 1);
  items.value = next;
}

function selectItem(entry: ComboboxPickerItemEntry, options?: { close?: boolean }): void {
  valueCtl.setValue(entry.value);
  if (props.fillInputOnSelect) {
    const text = typeof entry.label === 'string' ? entry.label : entry.value;
    inputCtl.setValue(text);
  }
  if (options?.close ?? true) openCtl.setValue(false);
}

provide<ComboboxPickerContextValue>(comboboxContextKey, {
  get open() {
    return openCtl.value.value;
  },
  setOpen: openCtl.setValue,
  get value() {
    return valueCtl.value.value;
  },
  setValue: valueCtl.setValue,
  get inputValue() {
    return inputCtl.value.value;
  },
  setInputValue: inputCtl.setValue,
  get activeId() {
    return activeId.value;
  },
  setActiveId: (id) => {
    activeId.value = id;
  },
  registerItem,
  unregisterItem,
  get items() {
    return items.value;
  },
  inputEl,
  contentEl,
  get listboxId() {
    return listboxId;
  },
  get isDisabled() {
    return props.isDisabled;
  },
  get isInvalid() {
    return props.isInvalid;
  },
  selectItem,
});

const selected = computed(() => valueCtl.value.value);

const formResetAnchor = useTemplateRef<HTMLInputElement>('formResetAnchor');
const formResetRevision = useNativeFormReset(formResetAnchor, () => {
  openCtl.reset();
  valueCtl.reset();
  inputCtl.reset();
});
</script>

<template>
  <slot :key="formResetRevision" />
  <input v-if="name" type="hidden" :name="name" :value="selected" />
  <input
    ref="formResetAnchor"
    type="hidden"
    :form="typeof $attrs.form === 'string' ? $attrs.form : undefined"
    aria-hidden="true"
  />
</template>
