<script lang="ts">
import type { Orientation } from '../../../foundation/utils';

export interface CheckboxGroupProps {
  /** The group legend (label-equivalent for fieldset). Fill the `legend` slot for richer content. */
  legend?: string | number;

  /** The selected values, controlled — React's spelling, which wins when both are set. */
  value?: ReadonlyArray<string>;

  /** The selected values, controlled. The `v-model` binding target. */
  modelValue?: ReadonlyArray<string>;

  /** The initial values (uncontrolled). */
  defaultValue?: ReadonlyArray<string>;

  /** The disabled state for the whole group. */
  isDisabled?: boolean;

  /** The layout direction. Default `vertical`. */
  orientation?: Orientation;

  /** The group's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useSlots, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Orientation as OrientationValue } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import Fieldset from '../fieldset/Fieldset.vue';
import Legend from '../legend/Legend.vue';
import { CheckboxGroupKey, type CheckboxGroupContextValue } from './CheckboxGroupContext';

/**
 * Multi-select group of `CheckboxField` children. Each child must declare a
 * `value` prop the group uses to track selection.
 *
 * Form-aware at GROUP level: inside a `Field`/`form.Field` the fieldset takes the
 * context id (so the `Field` label's `htmlFor` resolves) plus `aria-labelledby`/
 * `aria-describedby`/`aria-invalid`, and the flags cascade to every item — the
 * items themselves sever the group context's id so they keep unique ids.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'CheckboxGroup', inheritAttrs: false });

const props = withDefaults(defineProps<CheckboxGroupProps>(), {
  orientation: OrientationValue.Vertical,
  /* Explicit `undefined` default: the flag falls back to the form control context, and Vue
     casts an absent `boolean` prop to `false` — which would shadow it. */
  isDisabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: ReadonlyArray<string>];
  /** Replaces React's `onValueChange`. */
  'value-change': [value: ReadonlyArray<string>];
}>();

/** The `<CheckboxField>` children with `value="…"` attached — React's `children`. */
defineSlots<{
  default(): unknown;
  legend?(): unknown;
}>();

const attrs = useAttrs();
const slots = useSlots();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useFormControl();

const isGroupDisabled = computed(() => props.isDisabled ?? ctx?.isDisabled);
const isGroupInvalid = computed(() => ctx?.isInvalid ?? false);

const controlled = useControlled<ReadonlyArray<string>>({
  controlled: () => props.value ?? props.modelValue,
  default: () => props.defaultValue ?? [],
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const selected = controlled.value;

const context: CheckboxGroupContextValue = {
  isSelected: (value) => value !== undefined && selected.value.includes(value),
  toggle: (value) => {
    if (value === undefined) return;
    controlled.setValue(
      selected.value.includes(value)
        ? selected.value.filter((x) => x !== value)
        : [...selected.value, value],
    );
  },
  isDisabled: () => isGroupDisabled.value,
  isInvalid: () => isGroupInvalid.value,
};

provide(CheckboxGroupKey, context);

const hasLegend = computed(() => Boolean(props.legend) || Boolean(slots.legend));

const groupId = computed(() => props.id ?? ctx?.id);
const labelledBy = computed(() => ctx?.labelledBy);
const describedBy = computed(() => ctx?.describedBy);
const ariaInvalid = computed(() => isGroupInvalid.value || undefined);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() => cn(attrs.class as ClassValue));

const listClass = computed(() =>
  cn(
    'flex gap-3',
    props.orientation === OrientationValue.Vertical ? 'flex-col' : 'flex-row flex-wrap',
  ),
);

const root = useTemplateRef<{ el: HTMLFieldSetElement | null }>('root');

/** The rendered `<fieldset>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: computed(() => root.value?.el ?? null) });
</script>

<template>
  <Fieldset
    ref="root"
    :id="groupId"
    :disabled="isGroupDisabled"
    :aria-labelledby="labelledBy"
    :aria-describedby="describedBy"
    :aria-invalid="ariaInvalid"
    :class="rootClass"
    v-bind="passthroughAttrs"
  >
    <Legend v-if="hasLegend">
      <slot name="legend">{{ legend }}</slot>
    </Legend>
    <div :class="listClass">
      <slot />
    </div>
  </Fieldset>
</template>
