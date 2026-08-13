<script lang="ts">
import type { Placement } from '@floating-ui/vue';

export interface MultiSelectProps {
  /** The selected values, controlled — React's spelling, which wins when both are set. */
  value?: ReadonlyArray<string>;

  /** The selected values, controlled. The `v-model` binding target. */
  modelValue?: ReadonlyArray<string>;

  /** The initial selected values when uncontrolled. */
  defaultValue?: ReadonlyArray<string>;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  isDisabled?: boolean;

  /** The hidden-input name; one hidden input is rendered per selected value. */
  name?: string;

  /** The invalid surface override. Falls back to the surrounding form control's `isInvalid`. */
  isInvalid?: boolean;

  /** The initial open state of the dropdown when uncontrolled. */
  defaultOpen?: boolean;

  /** The dropdown open state, controlled. The `v-model:open` binding target. */
  open?: boolean;

  /** The dropdown open state, controlled — the house boolean spelling of `open`; `open` wins when both are set. */
  isOpen?: boolean;

  /** The floating placement of the dropdown. */
  placement?: Placement;
}
</script>

<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { Popover } from '../../overlays';
import { multiSelectContextKey, type MultiSelectContextValue } from './MultiSelectContext';

/**
 * State owner for a MultiSelect tree. Renders the `Popover` that hosts the trigger and the
 * panel, plus one hidden input per selected value.
 *
 * Inherits id/disabled/invalid/labelledby/describedby from a surrounding `<Field>`;
 * standalone props win when provided, context fills the gaps (Select parity).
 */
defineOptions({ name: 'MultiSelect', inheritAttrs: false });

/** The MultiSelect tree — trigger and content. React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<MultiSelectProps>(), {
  defaultOpen: false,
  placement: 'bottom',
  /* Explicit `undefined` defaults are load-bearing: `useControlled` keys on `=== undefined`,
     and Vue casts an absent `boolean` prop to `false`. Without these, `open`/`isOpen` would
     read as "controlled, and closed" — pinning the dropdown shut and making `defaultOpen`
     dead — and `isDisabled`/`isInvalid` would shadow the surrounding `<Field>` context. */
  value: undefined,
  modelValue: undefined,
  open: undefined,
  isOpen: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [values: ReadonlyArray<string>];
  /** Replaces React's `onValueChange`. */
  'value-change': [values: ReadonlyArray<string>];
  /** The `v-model:open` half. */
  'update:open': [open: boolean];
  /** Replaces React's `onOpenChange`. */
  'open-change': [open: boolean];
}>();

/* `field` is a live-getter object — read fields off it, never destructure. */
const field = useFormControl();

const finalDisabled = computed(() => props.isDisabled ?? field?.isDisabled ?? false);
const finalInvalid = computed(() => props.isInvalid ?? field?.isInvalid);

const openCtl = useControlled<boolean>({
  controlled: () => (props.open !== undefined ? props.open : props.isOpen),
  default: () => props.defaultOpen,
  onChange: (next) => {
    emit('update:open', next);
    emit('open-change', next);
  },
});

const valuesCtl = useControlled<ReadonlyArray<string>>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? [],
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const labels = ref<Record<string, string | number>>({});

function registerLabel(value: string, label: string | number): void {
  if (labels.value[value] === label) return;
  labels.value = { ...labels.value, [value]: label };
}

function unregisterLabel(value: string): void {
  if (!(value in labels.value)) return;
  const next = { ...labels.value };
  delete next[value];
  labels.value = next;
}

provide<MultiSelectContextValue>(multiSelectContextKey, {
  get open() {
    return openCtl.value.value;
  },
  setOpen: openCtl.setValue,
  get values() {
    return valuesCtl.value.value;
  },
  setValues: valuesCtl.setValue,
  get labels() {
    return labels.value;
  },
  registerLabel,
  unregisterLabel,
  get isDisabled() {
    return finalDisabled.value;
  },
  get name() {
    return props.name;
  },
  get isInvalid() {
    return finalInvalid.value;
  },
  get fieldId() {
    return field?.id;
  },
  get labelId() {
    return field?.labelledBy;
  },
  get describedBy() {
    return field?.describedBy;
  },
});

const isOpenNow = computed(() => openCtl.value.value);
const selected = computed(() => valuesCtl.value.value);
</script>

<template>
  <Popover
    :open="isOpenNow"
    :placement="placement"
    :offset="6"
    @open-change="openCtl.setValue"
  >
    <slot />
    <!-- Always-rendered — inside PopoverContent they would vanish from form submission when closed. -->
    <template v-if="name">
      <input v-for="v in selected" :key="v" type="hidden" :name="name" :value="v" />
    </template>
  </Popover>
</template>
