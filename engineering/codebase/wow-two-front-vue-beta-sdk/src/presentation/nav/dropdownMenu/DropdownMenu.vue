<script lang="ts">
import type { Placement } from '@floating-ui/vue';

/**
 * The prop surface of `DropdownMenu`.
 *
 * `open` and `isOpen` are the same controlled state under two names: `open` is
 * the `v-model:open` binding target and React's own spelling, `isOpen` the house
 * boolean spelling that mirrors the rest of the port. `open` wins when both are
 * set. React's `onOpenChange` is the `open-change` emit; `update:open` fires
 * alongside it so `v-model:open` works.
 */
export interface DropdownMenuProps {
  /** The open state, controlled. The `v-model:open` binding target. */
  open?: boolean;

  /** The open state, controlled — the house spelling of `open`; `open` wins when both are set. */
  isOpen?: boolean;

  /** The initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;

  /** The Floating UI placement. Default `bottom-start`. */
  placement?: Placement;

  /** The distance between trigger and menu in px. Default 6. */
  offset?: number;
}
</script>

<script setup lang="ts">
import { computed, provide, shallowRef } from 'vue';
import { useControlled } from '../../../foundation/hooks';
import { dropdownMenuContextKey } from './DropdownMenuContext';

/**
 * State owner for a DropdownMenu tree. Renders only its slot — React returned a
 * bare context Provider, which has no element of its own.
 */
defineOptions({ name: 'DropdownMenu', inheritAttrs: false });

/** The DropdownMenu tree — `DropdownMenuTrigger` and `DropdownMenuContent`. React's `children`. */
defineSlots<{ default(): unknown }>();

/** `open` / `isOpen` default to `undefined` so an absent prop cannot read as an explicit `false`. */
const props = withDefaults(defineProps<DropdownMenuProps>(), {
  open: undefined,
  isOpen: undefined,
  defaultOpen: false,
  placement: 'bottom-start',
  offset: 6,
});

const emit = defineEmits<{
  /** The `v-model:open` half. */
  'update:open': [open: boolean];

  /** Replaces React's `onOpenChange`. */
  'open-change': [open: boolean];
}>();

const controlled = useControlled<boolean>({
  controlled: () => (props.open !== undefined ? props.open : props.isOpen),
  default: () => props.defaultOpen,
  onChange: (value) => {
    emit('update:open', value);
    emit('open-change', value);
  },
});

provide(dropdownMenuContextKey, {
  open: controlled.value,
  setOpen: controlled.setValue,
  triggerEl: shallowRef<HTMLElement | null>(null),
  openFocus: { current: 'first' },
  placement: computed(() => props.placement),
  offset: computed(() => props.offset),
});
</script>

<template>
  <slot />
</template>
