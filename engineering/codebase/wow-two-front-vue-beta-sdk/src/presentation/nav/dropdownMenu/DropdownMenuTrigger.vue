<script lang="ts">
/**
 * The prop surface of `DropdownMenuTrigger`.
 *
 * React declared `extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>`;
 * attributes reach the root through `useAttrs` here, so only `asChild` remains.
 */
export interface DropdownMenuTriggerProps {
  /** The as-child toggle — renders the trigger as its single slot child (e.g. `<Button>`). */
  asChild?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, watch, type ComponentPublicInstance } from 'vue';
import { Primitive } from '../../../foundation/primitives';
import { toHtmlElement } from '../NavHelpers';
import { useDropdownMenuContext } from './DropdownMenuContext';

/** Toggles the enclosing `DropdownMenu` and doubles as its positioning anchor. */
defineOptions({ name: 'DropdownMenuTrigger', inheritAttrs: false });

/** The trigger content — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<DropdownMenuTriggerProps>(), { asChild: false });

const attrs = useAttrs();
const context = useDropdownMenuContext();
const inner = useTemplateRef<ComponentPublicInstance>('inner');

/* Lifted to a setup const so the template auto-unwraps it (a plain injected object does not). */
const isOpen = context.open;

/* React memoized a composed callback ref to keep the anchor node from thrashing; a post-flush watch is the equivalent. */
watch(
  inner,
  (instance) => {
    context.triggerEl.value = toHtmlElement(instance?.$el);
  },
  { immediate: true, flush: 'post' },
);

function handleClick(event: MouseEvent): void {
  if (event.defaultPrevented) return;
  context.openFocus.current = 'first';
  context.setOpen(!context.open.value);
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  if (
    event.key === 'ArrowDown' ||
    event.key === 'ArrowUp' ||
    event.key === 'Enter' ||
    event.key === ' '
  ) {
    event.preventDefault();
    // APG menu-button pattern: ArrowUp-open focuses the last item.
    context.openFocus.current = event.key === 'ArrowUp' ? 'last' : 'first';
    context.setOpen(true);
  }
}

/** `Primitive` renders the real element, so its `$el` is this component's root. */
const el = computed(() => (inner.value?.$el ?? null) as HTMLElement | null);

defineExpose({ el });
</script>

<template>
  <!-- Own attrs, then `v-bind="attrs"`, then own handlers last — Vue chains the
       caller's handler first and ours second, React's `onClick?.(e)` order, which
       is what makes the `defaultPrevented` opt-out work. -->
  <Primitive
    ref="inner"
    as="button"
    :as-child="props.asChild"
    type="button"
    aria-haspopup="menu"
    :aria-expanded="isOpen"
    :data-state="isOpen ? 'open' : 'closed'"
    v-bind="attrs"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <slot />
  </Primitive>
</template>
