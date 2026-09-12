<script lang="ts">
/**
 * The prop surface of `ContextMenuTrigger`.
 *
 * React declared `extends HTMLAttributes<HTMLDivElement>`; attributes reach the
 * root through `useAttrs` here, which leaves `asChild` and `isDisabled`.
 */
export interface ContextMenuTriggerProps {
  /** The as-child toggle — renders the trigger as its single slot child. */
  readonly asChild?: boolean;

  /** The disabled state — blocks both the right-click and the long-press open. */
  readonly isDisabled?: boolean;
}

/** The long-press duration, in ms, that opens the menu on touch. */
const LongPressMs = 600;

/** Build a zero-size virtual element at coordinates to anchor Floating UI. */
function makeVirtualAnchor(x: number, y: number): HTMLElement {
  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = '0px';
  el.style.height = '0px';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  return el;
}
</script>

<script setup lang="ts">
import { computed, onScopeDispose, useAttrs, useTemplateRef, watch, type ComponentPublicInstance } from 'vue';
import { Primitive } from '../../../foundation/primitives';
import { NavExtensions } from '../NavExtensions';
import { useContextMenuContext } from './ContextMenuContext';

/** Renders the region a right-click, or a touch long-press, opens the menu over. */
defineOptions({ name: 'ContextMenuTrigger', inheritAttrs: false });

/** The region's content — React's `children`. */
defineSlots<{ default(): unknown }>();

/** `isDisabled` defaults to `undefined`, not `false` — an absent optional boolean must stay absent. */
const props = withDefaults(defineProps<ContextMenuTriggerProps>(), {
  asChild: false,
  isDisabled: undefined,
});

const attrs = useAttrs();
const context = useContextMenuContext();
const inner = useTemplateRef<ComponentPublicInstance>('inner');

let longPressTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  inner,
  (instance) => {
    context.triggerEl.value = NavExtensions.toHtmlElement(instance?.$el);
  },
  { immediate: true, flush: 'post' },
);

function clearLongPress(): void {
  if (longPressTimer) clearTimeout(longPressTimer);
  longPressTimer = null;
}

// Clear a pending long-press timer if the trigger unmounts mid-press.
onScopeDispose(clearLongPress);

function handleContextMenu(event: MouseEvent): void {
  if (event.defaultPrevented || props.isDisabled) return;
  event.preventDefault();
  context.setAnchor(makeVirtualAnchor(event.clientX, event.clientY));
  context.setOpen(true);
}

function handlePointerDown(event: PointerEvent): void {
  // Capture the focus-restore target before the browser's mousedown focus
  // fixup blurs it (this trigger is a non-focusable div, so the press moves
  // focus to <body> before `contextmenu` fires). Only for gestures that can
  // open the menu: right button / touch.
  if (!props.isDisabled && !context.open.value && (event.button === 2 || event.pointerType === 'touch')) {
    context.restoreFocus.current =
      document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement
        : null;
  }
  if (event.defaultPrevented || props.isDisabled || event.pointerType !== 'touch') return;
  const x = event.clientX;
  const y = event.clientY;
  longPressTimer = setTimeout(() => {
    context.setAnchor(makeVirtualAnchor(x, y));
    context.setOpen(true);
  }, LongPressMs);
}

/** `Primitive` renders the real element, so its `$el` is this component's root. */
const el = computed(() => (inner.value?.$el ?? null) as HTMLElement | null);

defineExpose({ el });
</script>

<template>
  <!-- `v-bind="attrs"` before the own handlers, so a consumer's `contextmenu` /
       `pointerdown` handler runs first — React's `onContextMenu?.(e)` order,
       which is what makes the `defaultPrevented` opt-out work. -->
  <Primitive
    ref="inner"
    as="div"
    :as-child="asChild"
    v-bind="attrs"
    @contextmenu="handleContextMenu"
    @pointerdown="handlePointerDown"
    @pointerup="clearLongPress"
    @pointercancel="clearLongPress"
  >
    <slot />
  </Primitive>
</template>
