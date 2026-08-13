<script lang="ts">
import { inject, type ComputedRef, type InjectionKey, type Ref, type ShallowRef } from 'vue';

/** Defines the ARIA dialog role a `Modal` exposes. */
export const ModalRole = {
  /** Refers to a standard dialog. */
  Dialog: 'dialog',
  /** Refers to an alert dialog that interrupts to convey an urgent message. */
  AlertDialog: 'alertdialog',
} as const;

export type ModalRole = (typeof ModalRole)[keyof typeof ModalRole];

/**
 * The value shared with `ModalTrigger` / `ModalContent`.
 *
 * React's context held plain values re-created on every render; here the
 * reactive fields stay refs so a child reads the live value without the root
 * re-rendering it.
 */
export interface ModalContextValue {
  /** The resolved open state. Writable — an assignment routes through `setOpen`. */
  open: Ref<boolean>;
  setOpen: (open: boolean) => void;
  /** The trigger element — the focus-return target when the modal closes. */
  triggerEl: ShallowRef<HTMLElement | null>;
  titleId: string;
  descriptionId: string;
  role: ComputedRef<ModalRole>;
  dismissOnOutsideClick: ComputedRef<boolean>;
  dismissOnEscape: ComputedRef<boolean>;
}

export const modalContextKey: InjectionKey<ModalContextValue> = Symbol('wow-two.modal');

export function useModalContext(): ModalContextValue {
  const context = inject(modalContextKey, null);
  if (!context) throw new Error('Modal.* must be used inside <Modal>');
  return context;
}

/**
 * The prop surface of `Modal`.
 *
 * `open` and `isOpen` are the same controlled state under two names: `open` is
 * the `v-model:open` binding target, `isOpen` the house boolean spelling that
 * mirrors the rest of the port. `open` wins when both are set. React's
 * `onOpenChange` is the `open-change` emit; `update:open` fires alongside it so
 * `v-model:open` works.
 */
export interface ModalProps {
  /** The open state, controlled. The `v-model:open` binding target. */
  open?: boolean;

  /** The open state, controlled — the house spelling of `open`; `open` wins when both are set. */
  isOpen?: boolean;

  /** The initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;

  /** The outside-click dismissal toggle. Default `true`. */
  dismissOnOutsideClick?: boolean;

  /** The Escape dismissal toggle. Default `true`. */
  dismissOnEscape?: boolean;

  /** The ARIA dialog role. Internal — `AlertModal` overrides this. */
  role?: ModalRole;
}
</script>

<script setup lang="ts">
import { computed, provide, shallowRef } from 'vue';
import { useControlled, useId } from '../../../foundation/hooks';

/**
 * State + a11y-id owner for a Modal tree. Renders only its slot — React
 * returned a bare context Provider, which has no element of its own.
 */
defineOptions({ name: 'Modal', inheritAttrs: false });

/** The Modal tree — `ModalTrigger` and `ModalContent`. React's `children`. */
defineSlots<{ default(): unknown }>();

/**
 * `open: undefined` / `isOpen: undefined` are load-bearing: Vue coerces an
 * absent `Boolean` prop to `false` unless the declaration *owns* a `default`
 * key, which would make the modal read as explicitly-closed-and-controlled and
 * strand the uncontrolled path. Declaring the default as `undefined` keeps the
 * three states React had — absent / `true` / `false`.
 */
const props = withDefaults(defineProps<ModalProps>(), {
  open: undefined,
  isOpen: undefined,
  defaultOpen: false,
  dismissOnOutsideClick: true,
  dismissOnEscape: true,
  role: 'dialog',
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

const triggerEl = shallowRef<HTMLElement | null>(null);
const titleId = useId('modal-title');
const descriptionId = useId('modal-description');

provide(modalContextKey, {
  open: controlled.value,
  setOpen: controlled.setValue,
  triggerEl,
  titleId,
  descriptionId,
  role: computed(() => props.role),
  dismissOnOutsideClick: computed(() => props.dismissOnOutsideClick),
  dismissOnEscape: computed(() => props.dismissOnEscape),
});
</script>

<template>
  <slot />
</template>
