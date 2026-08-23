<script lang="ts">
import type { OverlayPosition } from '../../../foundation/utils';

export interface UndoBarProps {
  isOpen: boolean;
  /** The snackbar copy. Rich content → the `message` slot. Required in React; optional here so the slot form is usable — supply one or the other. */
  message?: string;
  undoLabel?: string;
  /** The auto-dismiss delay in ms; `Infinity` = sticky. Default 5000. */
  duration?: number;
  canPauseOnHover?: boolean;
  position?: OverlayPosition;
  hasCountdown?: boolean;
}
</script>

<script setup lang="ts">
import { computed, getCurrentInstance, onUnmounted, ref, useAttrs, watch } from 'vue';
import { cn, OverlayPosition as OverlayPositionToken, surfaceVariants } from '../../../foundation/utils';
import { Portal, Presence } from '../../../foundation/primitives';

const POSITION: Record<OverlayPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

/**
 * Snackbar with a single "Undo" action. Auto-dismisses after `duration`;
 * pause-on-hover preserves remaining time. For multi-toast queues use the L5
 * `ToastHost` instead.
 *
 * React's `className` arrives as the ordinary `class` attr and is merged onto
 * the panel, not the positioning wrapper — the same node it landed on in React.
 */
defineOptions({ name: 'UndoBar', inheritAttrs: false });

const props = withDefaults(defineProps<UndoBarProps>(), {
  undoLabel: 'Undo',
  duration: 5000,
  canPauseOnHover: true,
  position: OverlayPositionToken.BottomCenter,
  hasCountdown: false,
});

const emit = defineEmits<{
  /** Replaces React's `onOpenChange`. Fires with `false` on auto-dismiss and after undo. */
  'open-change': [open: boolean];
  /** Replaces React's `onUndo`; omitting `@undo` omits the undo button. */
  undo: [];
}>();

const attrs = useAttrs();
const instance = getCurrentInstance();

/**
 * Mirrors React's `onUndo && <button/>` guard — the undo button renders only
 * when the consumer bound `@undo`. Read through a call, not a cached computed:
 * `instance.vnode` is replaced on every re-render.
 */
const hasUndo = () => Boolean(instance?.vnode.props?.onUndo);

const progress = ref(1);
const paused = ref(false);

/* `useRef` counterparts — read/written across ticks, never rendered. */
let start = 0;
let remaining = props.duration;
let raf: number | null = null;

/**
 * The React `useEffect` timer, dep-for-dep: `[isOpen, duration, paused, hasCountdown]`.
 * `flush: 'post'` is the `useEffect` analogue, and `onCleanup` replays the
 * teardown that banks the elapsed time back into `remaining`.
 */
watch(
  [() => props.isOpen, () => props.duration, paused, () => props.hasCountdown],
  ([isOpen, duration, isPaused, hasCountdown], _previous, onCleanup) => {
    if (!isOpen) {
      remaining = duration;
      progress.value = 1;
      return;
    }
    if (duration === Infinity) {
      progress.value = 1;
      return;
    }
    if (isPaused) return;
    /* `immediate: true` runs this watcher on the server too, and an UndoBar is rendered
       `is-open`. Neither `window` nor `requestAnimationFrame` exists there — start no clock;
       the same watcher arms it on the client, where the countdown is the only thing it drives. */
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return;

    start = performance.now();
    if (!hasCountdown) {
      // No visible countdown — a single timeout, no per-frame re-renders.
      const handle = window.setTimeout(() => {
        emit('open-change', false);
      }, remaining);
      onCleanup(() => {
        window.clearTimeout(handle);
        const elapsed = performance.now() - start;
        remaining = Math.max(0, remaining - elapsed);
      });
      return;
    }
    const tick = (now: number) => {
      const elapsed = now - start;
      const left = Math.max(0, remaining - elapsed);
      progress.value = left / duration;
      if (left <= 0) {
        emit('open-change', false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    onCleanup(() => {
      if (raf != null) cancelAnimationFrame(raf);
      const elapsed = performance.now() - start;
      remaining = Math.max(0, remaining - elapsed);
    });
  },
  { immediate: true, flush: 'post' },
);

onUnmounted(() => {
  if (raf != null) cancelAnimationFrame(raf);
});

const setPaused = (value: boolean) => {
  if (props.canPauseOnHover) paused.value = value;
};

const onUndoClick = () => {
  emit('undo');
  emit('open-change', false);
};

const wrapperClasses = computed(() => cn('fixed z-toast', POSITION[props.position]));

/**
 * `Presence` clones `data-state` onto this node, and the enter/exit tokens are
 * gated on it. slide-in-bottom/out-bottom carry their own fade; `motion-safe`
 * so reduced-motion users get no movement.
 */
const panelClasses = computed(() =>
  cn(
    'relative flex items-center gap-3 overflow-hidden text-sm',
    surfaceVariants({ variant: 'surface', radius: 'md', padding: 'sm', elevation: 3 }),
    'px-4 py-2.5',
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-bottom)',
    'motion-safe:data-[state=closed]:animate-(--animate-slide-out-bottom)',
    'motion-reduce:animate-none',
    attrs.class as string | undefined,
  ),
);

const showCountdown = computed(() => props.hasCountdown && props.duration !== Infinity);
</script>

<template>
  <!--
    Static positioning wrapper holds the fixed corner + (for `*-center`) the
    centering `-translate-x-1/2`; the inner panel carries the slide keyframe,
    whose own `translateY` would otherwise clobber that centering translate if
    both sat on one node. `Portal` stays mounted; `Presence` owns the panel's
    mount so the exit (slide-out + fade) plays before unmount, cloning
    `data-state` onto the panel for its motion.
  -->
  <Portal>
    <div :class="wrapperClasses">
      <Presence :is-present="props.isOpen">
        <div
          role="status"
          aria-live="polite"
          :class="panelClasses"
          @mouseenter="setPaused(true)"
          @mouseleave="setPaused(false)"
          @focus="setPaused(true)"
          @blur="setPaused(false)"
        >
          <span class="flex-1">
            <slot name="message">{{ props.message }}</slot>
          </span>
          <button
            v-if="hasUndo()"
            type="button"
            class="font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
            @click="onUndoClick"
          >
            {{ props.undoLabel }}
          </button>
          <div v-if="showCountdown" class="absolute bottom-0 left-0 h-0.5 w-full bg-border">
            <div
              class="h-full bg-primary transition-[width] duration-100 ease-linear"
              :style="{ width: `${progress * 100}%` }"
            />
          </div>
        </div>
      </Presence>
    </div>
  </Portal>
</template>
