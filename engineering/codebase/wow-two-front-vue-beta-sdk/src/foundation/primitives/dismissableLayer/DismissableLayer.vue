<script lang="ts">
import type { HTMLAttributes } from 'vue';

export interface DismissableLayerProps extends /* @vue-ignore */ HTMLAttributes {
  /** Fires when Escape is pressed and this is the topmost layer. */
  onEscape?: (event: KeyboardEvent) => void;

  /** Fires when a pointerdown lands outside this layer's DOM and this is topmost. */
  onOutsidePointerDown?: (event: PointerEvent) => void;

  /** The Escape-listener disable flag for this layer. */
  isEscapeDisabled?: boolean;

  /** The outside-pointer-down-listener disable flag for this layer. */
  isOutsideClickDisabled?: boolean;
}

interface LayerEntry {
  node: HTMLElement;
  onEscape?: (event: KeyboardEvent) => void;
  onOutsidePointerDown?: (event: PointerEvent) => void;
}

const layerStack: Array<LayerEntry> = [];
</script>

<script setup lang="ts">
import { onMounted, onScopeDispose, useTemplateRef, watch } from 'vue';

/**
 * Stack-aware dismissal layer. Multiple layers may stack (modal > popover);
 * only the topmost reacts to Escape / outside click. Used as the base of
 * Modal, Drawer, Popover, Menu, HoverCard, ContextMenu.
 */
defineOptions({ name: 'DismissableLayer' });

const props = defineProps<DismissableLayerProps>();

const el = useTemplateRef<HTMLDivElement>('el');

// The stack entry reads the handlers off `props` at call time rather than
// capturing them. React needed refs here so registration could run once —
// re-registering on callback identity change would reorder the stack and
// corrupt dismissal ordering. Vue props are live, so the indirection is free.
let entry: LayerEntry | null = null;

onMounted(() => {
  const node = el.value;
  if (!node) return;
  entry = {
    node,
    onEscape: (event) => props.onEscape?.(event),
    onOutsidePointerDown: (event) => props.onOutsidePointerDown?.(event),
  };
  layerStack.push(entry);
});

// Registered at setup level — `onScopeDispose` only binds to the component's
// effect scope while that scope is current, which it is not inside `onMounted`.
onScopeDispose(() => {
  if (!entry) return;
  const index = layerStack.indexOf(entry);
  if (index >= 0) layerStack.splice(index, 1);
  entry = null;
});

watch(
  () => props.isEscapeDisabled,
  (isDisabled, _previous, onCleanup) => {
    if (isDisabled || typeof document === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const top = layerStack[layerStack.length - 1];
      if (top && top.node === el.value) top.onEscape?.(event);
    };
    document.addEventListener('keydown', onKeyDown);
    onCleanup(() => document.removeEventListener('keydown', onKeyDown));
  },
  { immediate: true },
);

watch(
  () => props.isOutsideClickDisabled,
  (isDisabled, _previous, onCleanup) => {
    if (isDisabled || typeof document === 'undefined') return;
    const onPointer = (event: PointerEvent) => {
      const top = layerStack[layerStack.length - 1];
      if (!top || top.node !== el.value) return;
      const target = event.target as Node | null;
      if (!target || el.value?.contains(target)) return;
      top.onOutsidePointerDown?.(event);
    };
    document.addEventListener('pointerdown', onPointer, true);
    onCleanup(() => document.removeEventListener('pointerdown', onPointer, true));
  },
  { immediate: true },
);

defineExpose({ el });
</script>

<template>
  <div ref="el"><slot /></div>
</template>
