<script lang="ts">
import { inject, type ComputedRef, type InjectionKey, type Ref, type ShallowRef } from 'vue';
import type { Placement } from '@floating-ui/vue';

/**
 * The value shared with `PopoverTrigger` / `PopoverContent`.
 *
 * React carried the trigger twice — a ref for imperative focus and a state copy
 * so an initially-open popover re-rendered anchored. A `shallowRef` is already
 * reactive, so one field covers both here.
 */
export interface PopoverContextValue {
  /** The resolved open state. Writable — an assignment routes through `setOpen`. */
  open: Ref<boolean>;
  setOpen: (open: boolean) => void;
  /** The trigger element — the positioning anchor and the focus-return target. */
  triggerEl: ShallowRef<HTMLElement | null>;
  placement: ComputedRef<Placement>;
  offset: ComputedRef<number>;
  dismissOnOutsideClick: ComputedRef<boolean>;
  dismissOnEscape: ComputedRef<boolean>;
}

export const popoverContextKey: InjectionKey<PopoverContextValue> = Symbol('wow-two.popover');

export function usePopoverContext(): PopoverContextValue {
  const context = inject(popoverContextKey, null);
  if (!context) throw new Error('Popover.* must be used inside <Popover>');
  return context;
}

/**
 * The prop surface of `Popover`.
 *
 * `open` and `isOpen` are the same controlled state under two names: `open` is
 * the `v-model:open` binding target, `isOpen` the house boolean spelling that
 * mirrors the rest of the port. `open` wins when both are set. React's
 * `onOpenChange` is the `open-change` emit; `update:open` fires alongside it so
 * `v-model:open` works.
 */
export interface PopoverProps {
  /** The open state, controlled. The `v-model:open` binding target. */
  open?: boolean;

  /** The open state, controlled — the house spelling of `open`, which wins when both are set. */
  isOpen?: boolean;

  /** The initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;

  /** The Floating UI placement. Default `bottom`. */
  placement?: Placement;

  /** The distance between anchor and panel in px. Default 8. */
  offset?: number;

  /** The outside-click dismissal toggle. Default `true`. */
  dismissOnOutsideClick?: boolean;

  /** The Escape dismissal toggle. Default `true`. */
  dismissOnEscape?: boolean;
}
</script>

<script setup lang="ts">
import { computed, provide, shallowRef } from 'vue';
import { useControlled } from '../../../foundation/hooks';

/**
 * State owner for a Popover tree. Renders only its slot — React returned a bare
 * context Provider, which has no element of its own.
 */
defineOptions({ name: 'Popover', inheritAttrs: false });

/** The Popover tree — `PopoverTrigger` and `PopoverContent`. React's `children`. */
defineSlots<{ default(): unknown }>();

/** `open` / `isOpen` default to `undefined` so an absent prop cannot read as an explicit `false`. */
const props = withDefaults(defineProps<PopoverProps>(), {
  open: undefined,
  isOpen: undefined,
  defaultOpen: false,
  placement: 'bottom',
  offset: 8,
  dismissOnOutsideClick: true,
  dismissOnEscape: true,
});

const emit = defineEmits<{
  /** The `v-model:open` half. */
  'update:open': [open: boolean];
  /** Replaces React's `onOpenChange`. */
  'open-change': [open: boolean];
}>();

const controlled = useControlled<boolean>({
  controlled: () => props.open ?? props.isOpen,
  default: () => props.defaultOpen,
  onChange: (value) => {
    emit('update:open', value);
    emit('open-change', value);
  },
});

const triggerEl = shallowRef<HTMLElement | null>(null);

provide(popoverContextKey, {
  open: controlled.value,
  setOpen: controlled.setValue,
  triggerEl,
  placement: computed(() => props.placement),
  offset: computed(() => props.offset),
  dismissOnOutsideClick: computed(() => props.dismissOnOutsideClick),
  dismissOnEscape: computed(() => props.dismissOnEscape),
});
</script>

<template>
  <slot />
</template>
