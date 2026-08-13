<script lang="ts">
import { inject, type ComputedRef, type InjectionKey, type Ref, type ShallowRef } from 'vue';
import type { Side } from '../../../foundation/utils';

/**
 * The value shared with `DrawerTrigger` / `DrawerContent`.
 *
 * React's context held plain values re-created on every render; here the
 * reactive fields stay refs so a child reads the live value without the root
 * re-rendering it.
 */
export interface DrawerContextValue {
  /** The resolved open state. Writable — an assignment routes through `setOpen`. */
  open: Ref<boolean>;
  setOpen: (open: boolean) => void;
  /** The trigger element — the focus-return target when the drawer closes. */
  triggerEl: ShallowRef<HTMLElement | null>;
  titleId: string;
  descriptionId: string;
  side: ComputedRef<Side>;
  dismissOnOutsideClick: ComputedRef<boolean>;
  dismissOnEscape: ComputedRef<boolean>;
}

export const drawerContextKey: InjectionKey<DrawerContextValue> = Symbol('wow-two.drawer');

export function useDrawerContext(): DrawerContextValue {
  const context = inject(drawerContextKey, null);
  if (!context) throw new Error('Drawer.* must be used inside <Drawer>');
  return context;
}

/**
 * The prop surface of `Drawer`.
 *
 * `open` and `isOpen` are the same controlled state under two names: `open` is
 * the `v-model:open` binding target, `isOpen` the house boolean spelling that
 * mirrors the rest of the port. `open` wins when both are set. React's
 * `onOpenChange` is the `open-change` emit; `update:open` fires alongside it so
 * `v-model:open` works.
 */
export interface DrawerProps {
  /** The open state, controlled. The `v-model:open` binding target. */
  open?: boolean;

  /** The open state, controlled — the house spelling of `open`, which wins when both are set. */
  isOpen?: boolean;

  /** The initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;

  /** The edge the panel slides in from. Default `right`. */
  side?: Side;

  /** The outside-click dismissal toggle. Default `true`. */
  dismissOnOutsideClick?: boolean;

  /** The Escape dismissal toggle. Default `true`. */
  dismissOnEscape?: boolean;
}
</script>

<script setup lang="ts">
import { computed, provide, shallowRef } from 'vue';
import { useControlled, useId } from '../../../foundation/hooks';

/**
 * State + a11y-id owner for a Drawer tree. Renders only its slot — React
 * returned a bare context Provider, which has no element of its own.
 */
defineOptions({ name: 'Drawer', inheritAttrs: false });

/** The Drawer tree — `DrawerTrigger` and `DrawerContent`. React's `children`. */
defineSlots<{ default(): unknown }>();

/**
 * `open: undefined` / `isOpen: undefined` are load-bearing: Vue coerces an
 * absent `Boolean` prop to `false` unless the declaration *owns* a `default`
 * key, which would strand the uncontrolled path behind a permanently-closed
 * controlled one.
 */
const props = withDefaults(defineProps<DrawerProps>(), {
  open: undefined,
  isOpen: undefined,
  defaultOpen: false,
  side: 'right',
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
const titleId = useId('drawer-title');
const descriptionId = useId('drawer-description');

provide(drawerContextKey, {
  open: controlled.value,
  setOpen: controlled.setValue,
  triggerEl,
  titleId,
  descriptionId,
  side: computed(() => props.side),
  dismissOnOutsideClick: computed(() => props.dismissOnOutsideClick),
  dismissOnEscape: computed(() => props.dismissOnEscape),
});
</script>

<template>
  <slot />
</template>
