<script lang="ts">
import type { Placement } from '@floating-ui/vue';

export interface TooltipProps {
  /** The tooltip body. Rich content goes through the `content` slot. */
  content?: string | number;

  /** The Floating UI placement. Default `top`. */
  placement?: Placement;

  /** The delay before opening on hover, in ms. Default 700. */
  openDelay?: number;

  /** The delay before closing on leave, in ms. Default 0. */
  closeDelay?: number;

  /**
   * The open state, controlled. The `v-model:open` binding target.
   *
   * `open` and `isOpen` are the same state under two names: `open` is React's own
   * spelling, `isOpen` the house boolean spelling that mirrors the rest of the
   * port. `open` wins when both are set. Same pairing as `overlays/modal`.
   */
  open?: boolean;

  /** The open state, controlled — the house spelling of `open`, which wins when both are set. */
  isOpen?: boolean;

  /** The initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;

  /** The disabled mode — suppresses rendering even on hover (e.g. when content is empty). */
  isDisabled?: boolean;
}
</script>

<script setup lang="ts">
import {
  cloneVNode,
  computed,
  onBeforeUnmount,
  ref,
  shallowRef,
  useSlots,
  watch,
} from 'vue';
import { cn } from '../../../foundation/utils';
import { useControlled, useEscape, useId, useReducedMotion } from '../../../foundation/hooks';
import {
  AnchoredPositioner,
  Portal,
  Presence,
  renderableChildren,
} from '../../../foundation/primitives';

/**
 * Hover-/focus-triggered tooltip. Wraps a single default-slot child as the
 * trigger; the tooltip body renders into a Portal positioned by Floating UI.
 * Default delays mirror the OS pattern (700ms in, 0 out). Escape dismisses
 * without moving focus (WCAG 1.4.13); the trigger is described by the tooltip
 * via `aria-describedby` while open.
 *
 * `inheritAttrs: false` because the component renders a fragment (trigger +
 * portal) — there is no single root for attrs to land on, exactly as in React.
 */
defineOptions({ name: 'Tooltip', inheritAttrs: false });

defineSlots<{
  /** The single child element — the trigger. Receives the handlers, the ref, and `aria-describedby`. */
  default(): unknown;
  /** The rich override for the `content` prop. */
  content?(): unknown;
}>();

const props = withDefaults(defineProps<TooltipProps>(), {
  content: undefined,
  placement: 'top',
  openDelay: 700,
  closeDelay: 0,
  open: undefined,
  isOpen: undefined,
  defaultOpen: false,
  isDisabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model:open` half. */
  'update:open': [open: boolean];
  /** Emits the open state on every change (hover, focus, Escape) — React's `onOpenChange`. */
  'open-change': [open: boolean];
}>();

const slots = useSlots();

/* `useControlled` returns a handle, not React's tuple, and takes `controlled` as a getter so the
   controlled branch tracks the prop. */
const { value: open, setValue: setOpen } = useControlled<boolean>({
  controlled: () => props.open ?? props.isOpen,
  default: props.defaultOpen,
  onChange: (next) => {
    emit('update:open', next);
    emit('open-change', next);
  },
});

const anchor = shallowRef<HTMLElement | null>(null);
const tooltipId = useId('tooltip');

let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

function clear(): void {
  if (openTimer) clearTimeout(openTimer);
  if (closeTimer) clearTimeout(closeTimer);
  openTimer = null;
  closeTimer = null;
}

function show(): void {
  clear();
  openTimer = setTimeout(() => setOpen(true), props.openDelay);
}

function hide(): void {
  clear();
  closeTimer = setTimeout(() => setOpen(false), props.closeDelay);
}

/* Clear pending timers on unmount. */
onBeforeUnmount(clear);

/* WCAG 1.4.13 — Escape dismisses immediately, without moving focus. */
useEscape(() => {
  clear();
  setOpen(false);
}, open);

const reducedMotion = useReducedMotion();

/**
 * React gated on `!!content`; a Vue consumer can supply the body through the `content` slot
 * instead, so either source counts. An empty tooltip still never opens.
 */
const hasContent = computed(() => !!props.content || !!slots.content);

const visible = computed(() => !props.isDisabled && open.value && hasContent.value);

/* Keep the Portal + positioner mounted while the exit animation plays.
   Becomes true with `visible`; cleared on the body's pop-out `animationend`
   (see `onAnimationEnd` below). With reduced motion no exit animation runs,
   so tear the shell down immediately on close. */
const mounted = ref(false);
watch(
  [visible, reducedMotion],
  ([isVisible, isReduced]) => {
    if (isVisible) mounted.value = true;
    else if (isReduced) mounted.value = false;
  },
  { immediate: true },
);

function onAnimationEnd(): void {
  if (!visible.value) mounted.value = false;
}

/** A function ref may receive a component's public instance; the positioner needs the DOM node. */
function setAnchor(value: unknown): void {
  const node = (value as { $el?: unknown } | null)?.$el ?? value;
  anchor.value = node instanceof HTMLElement ? node : null;
}

/**
 * React cloned the child element to attach the ref, the handlers and `aria-describedby`.
 * `cloneVNode` is the Vue counterpart and merges through `mergeProps`, so a handler the
 * consumer already put on the trigger is chained rather than replaced — the job React's
 * explicit `trigger.props.onPointerEnter?.(e)` forwarding did.
 *
 * The listener keys are all-lowercase after `on` (`onPointerenter`, not `onPointerEnter`):
 * Vue hyphenates the remainder to derive the DOM event name, so the React casing would
 * register `pointer-enter` and never fire.
 */
const trigger = computed(() => {
  const child = renderableChildren(slots.default?.())[0];
  if (!child) return null;
  const own = child.props?.['aria-describedby'] as string | undefined;
  return cloneVNode(
    child,
    {
      ref: setAnchor,
      'aria-describedby': visible.value ? [own, tooltipId].filter(Boolean).join(' ') : own,
      onPointerenter: show,
      onPointerleave: hide,
      onFocus: show,
      onBlur: hide,
    },
    true,
  );
});

const contentClasses = cn(
  'z-tooltip rounded-md bg-inverse px-2.5 py-1.5 text-xs text-inverse-foreground shadow-md',
  'motion-safe:data-[state=open]:animate-(--animate-pop-in)',
  'motion-safe:data-[state=closed]:animate-(--animate-pop-out)',
);
</script>

<template>
  <component :is="trigger" v-if="trigger" />
  <slot v-else />
  <Portal v-if="mounted">
    <!-- Exit animation bubbles up from the body; once the closed-state pop-out ends, tear down
         the Portal shell. Also covers the reduced-motion path, where no animation runs and
         `Presence` has already unmounted the body. -->
    <AnchoredPositioner
      :anchor="anchor"
      :placement="props.placement"
      :offset="6"
      @animationend="onAnimationEnd"
    >
      <!-- `Presence` clones `data-state` ("open" | "closed") + its tracking ref onto the body,
           which is what gates the pop-in / pop-out keyframes. Motion sits behind `motion-safe:`
           so reduced-motion users get an instant show/hide. -->
      <Presence :is-present="visible">
        <div :id="tooltipId" role="tooltip" :class="contentClasses">
          <slot name="content">{{ props.content }}</slot>
        </div>
      </Presence>
    </AnchoredPositioner>
  </Portal>
</template>
