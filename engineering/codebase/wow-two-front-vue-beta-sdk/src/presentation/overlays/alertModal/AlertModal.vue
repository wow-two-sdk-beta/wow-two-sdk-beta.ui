<script lang="ts">
import type { ModalProps } from '../modal';

/**
 * The prop surface of `AlertModal` — `Modal`'s, minus the two axes an alert
 * dialog fixes: `role` is always `alertdialog` and outside-click dismissal is
 * always off, so a destructive confirmation cannot be dismissed by accident.
 */
export type AlertModalProps = Omit<ModalProps, 'role' | 'dismissOnOutsideClick'>;
</script>

<script setup lang="ts">
import Modal from '../modal/Modal.vue';

/* Confirmation dialog — a `Modal` locked to `role="alertdialog"` with outside-click dismissal off. */
defineOptions({ name: 'AlertModal', inheritAttrs: false });

/** The AlertModal tree — `ModalTrigger` and `AlertModalContent`. React's `children`. */
defineSlots<{ default(): unknown }>();

/** Same `undefined` defaults as `Modal` — an absent `Boolean` prop must not read as an explicit `false`. */
const props = withDefaults(defineProps<AlertModalProps>(), {
  open: undefined,
  isOpen: undefined,
  defaultOpen: false,
  dismissOnEscape: true,
});

const emit = defineEmits<{
  /** The `v-model:open` half. */
  'update:open': [open: boolean];
  /** Replaces React's `onOpenChange`. */
  'open-change': [open: boolean];
}>();

function handleOpenChange(open: boolean): void {
  emit('update:open', open);
  emit('open-change', open);
}
</script>

<template>
  <Modal
    :open="props.open"
    :is-open="props.isOpen"
    :default-open="props.defaultOpen"
    :dismiss-on-escape="props.dismissOnEscape"
    role="alertdialog"
    :dismiss-on-outside-click="false"
    @open-change="handleOpenChange"
  >
    <slot />
  </Modal>
</template>
