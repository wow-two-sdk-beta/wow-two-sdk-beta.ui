<script lang="ts">
/* `AccordionType` is imported here (not in `<script setup>`) so the one binding
   serves as both the type below and the runtime value used in `withDefaults`. */
import { AccordionType } from './AccordionContext';

/**
 * Represents the prop surface of `Accordion`.
 *
 * React modelled this as a discriminated union — `{ type: 'single'; value?: string }` vs
 * `{ type: 'multiple'; value?: ReadonlyArray<string> }`. `defineProps<T>()` cannot take a
 * union: the SFC compiler resolves the type into a runtime props declaration and has no
 * way to express "these keys only when `type` is `multiple`". The two arms are flattened
 * into one interface with widened `value` / `defaultValue`, and the runtime still branches
 * on `type` exactly as before. `isCollapsible` is read only when `type` is `single`.
 */
export interface AccordionProps {
  /** The selection mode — one open panel (`single`) or many (`multiple`). Default `single`. */
  type?: AccordionType;
  /** The controlled open value — a string when `single`, an array when `multiple`. */
  value?: string | ReadonlyArray<string>;
  /** The initial open value when uncontrolled. */
  defaultValue?: string | ReadonlyArray<string>;
  /** The click-to-close behaviour for the open panel. `single` mode only. Default `false`. */
  isCollapsible?: boolean;
  /** The disabled state for every item in the group. Default `false`. */
  isDisabled?: boolean;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { Orientation, RovingFocusGroup } from '../../../foundation/primitives';
import { AccordionKey, type AccordionContextValue } from './AccordionContext';

/**
 * Vertical disclosure group. Arrow-key navigation comes from `RovingFocusGroup`;
 * the open set lives here and reaches items through injection.
 *
 * React attached the parts as `Accordion.Item` / `.Trigger` / `.Content` via
 * `Object.assign`. An SFC's generated default export cannot carry statics
 * cleanly, so they ship as siblings: `AccordionItem`, `AccordionTrigger`,
 * `AccordionContent`.
 */
defineOptions({ name: 'Accordion', inheritAttrs: false });

/** The `AccordionItem` children. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<AccordionProps>(), {
  type: AccordionType.Single,
  value: undefined,
  defaultValue: undefined,
  isCollapsible: false,
  isDisabled: false,
});

/** React's `onValueChange`. Payload is a string in `single` mode, an array in `multiple`. */
const emit = defineEmits<{
  'value-change': [value: string | ReadonlyArray<string>];
}>();

const attrs = useAttrs();
const group = useTemplateRef<InstanceType<typeof RovingFocusGroup>>('group');

/* Read once, exactly as React's `useState(defaultValue)` seed was. */
const initial = props.defaultValue ?? (props.type === AccordionType.Multiple ? [] : '');

const current = useControlled<string | ReadonlyArray<string>>({
  controlled: () => props.value,
  default: initial,
  onChange: (next) => emit('value-change', next),
});

function isOpen(value: string): boolean {
  const value_ = current.value.value;
  return Array.isArray(value_) ? value_.includes(value) : value_ === value;
}

function toggle(value: string): void {
  const value_ = current.value.value;
  if (props.type === AccordionType.Multiple) {
    const list = Array.isArray(value_) ? value_ : [];
    current.setValue(
      list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value],
    );
    return;
  }
  if (value_ === value) {
    if (props.isCollapsible) current.setValue('');
  } else {
    current.setValue(value);
  }
}

/* Live getter on `disabled` — a root-level `isDisabled` flip has to reach items
   that are already mounted, which a snapshot would not do. */
provide<AccordionContextValue>(AccordionKey, {
  isOpen,
  toggle,
  get disabled() {
    return props.isDisabled;
  },
});

const classes = computed(() => cn('flex flex-col', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el: computed(() => group.value?.el ?? null) });
</script>

<template>
  <RovingFocusGroup
    ref="group"
    :orientation="Orientation.Vertical"
    can-loop
    v-bind="rest"
    :class="classes"
  >
    <slot />
  </RovingFocusGroup>
</template>
