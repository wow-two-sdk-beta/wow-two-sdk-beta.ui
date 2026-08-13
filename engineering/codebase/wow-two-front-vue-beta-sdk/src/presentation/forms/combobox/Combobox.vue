<script lang="ts">
export interface ComboboxProps {
  /** The selected value, controlled — React's spelling, which wins when both are set. */
  value?: string;

  /** The selected value, controlled. The `v-model` binding target. */
  modelValue?: string;

  /** The initial selected value when uncontrolled. */
  defaultValue?: string;

  /** The typed text, controlled. The `v-model:input-value` binding target. */
  inputValue?: string;

  /** The initial typed text when uncontrolled. */
  defaultInputValue?: string;

  /** The disabled state. Default `false`. */
  isDisabled?: boolean;

  /** The invalid surface flag handed to `ComboboxInput`. */
  isInvalid?: boolean;

  /** The hidden input name; the hidden input emits the selected value. */
  name?: string;

  /** The initial open state of the panel when uncontrolled. */
  defaultOpen?: boolean;

  /** The panel open state, controlled. The `v-model:open` binding target. */
  open?: boolean;

  /** The panel open state, controlled — the house boolean spelling of `open`; `open` wins when both are set. */
  isOpen?: boolean;

  /** The fill-on-select behavior — when the user picks an item, set the input value to its label. Default true. */
  fillInputOnSelect?: boolean;
}
</script>

<script setup lang="ts">
import { computed, provide, ref, shallowRef } from 'vue';
import { useControlled, useId } from '../../../foundation/hooks';
import {
  comboboxContextKey,
  type ComboboxContextValue,
  type ComboboxItemEntry,
} from './ComboboxContext';

/**
 * State + a11y-id owner for a Combobox tree. Renders its children plus the hidden form input
 * carrying the selected value; the panel itself is portalled by `ComboboxContent`.
 */
defineOptions({ name: 'Combobox', inheritAttrs: false });

/** The Combobox tree — `ComboboxInput` and `ComboboxContent`. React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<ComboboxProps>(), {
  isDisabled: false,
  defaultOpen: false,
  fillInputOnSelect: true,
  /* Explicit `undefined` defaults are load-bearing: `useControlled` keys on `=== undefined`,
     and Vue casts an absent `boolean` prop to `false` — without these, `open`/`isOpen` would
     read as "controlled, and closed", pinning the panel shut and making `defaultOpen` dead. */
  value: undefined,
  modelValue: undefined,
  inputValue: undefined,
  open: undefined,
  isOpen: undefined,
  isInvalid: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: string];
  /** Replaces React's `onValueChange`. */
  'value-change': [value: string];
  /** The `v-model:input-value` half. */
  'update:inputValue': [input: string];
  /** Replaces React's `onInputChange`. */
  'input-change': [input: string];
  /** The `v-model:open` half. */
  'update:open': [open: boolean];
  /** Replaces React's `onOpenChange`. */
  'open-change': [open: boolean];
}>();

const openCtl = useControlled<boolean>({
  controlled: () => (props.open !== undefined ? props.open : props.isOpen),
  default: () => props.defaultOpen,
  onChange: (next) => {
    emit('update:open', next);
    emit('open-change', next);
  },
});

const valueCtl = useControlled<string>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? '',
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const inputCtl = useControlled<string>({
  controlled: () => props.inputValue,
  default: () => props.defaultInputValue ?? '',
  onChange: (next) => {
    emit('update:inputValue', next);
    emit('input-change', next);
  },
});

/* Reactive, unlike React's `useRef` array: `ComboboxContent` re-clamps the active id off this
   set whenever an item registers or unregisters (filtering), which a plain ref never triggered. */
const items = ref<Array<ComboboxItemEntry>>([]);
const activeId = ref<string | null>(null);
const inputEl = shallowRef<HTMLInputElement | null>(null);
const contentEl = shallowRef<HTMLElement | null>(null);
const listboxId = useId('combobox-listbox');

function registerItem(entry: ComboboxItemEntry): void {
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

function selectItem(entry: ComboboxItemEntry, options?: { close?: boolean }): void {
  valueCtl.setValue(entry.value);
  if (props.fillInputOnSelect) {
    const text = typeof entry.label === 'string' ? entry.label : entry.value;
    inputCtl.setValue(text);
  }
  if (options?.close ?? true) openCtl.setValue(false);
}

provide<ComboboxContextValue>(comboboxContextKey, {
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
</script>

<template>
  <slot />
  <input v-if="name" type="hidden" :name="name" :value="selected" />
</template>
