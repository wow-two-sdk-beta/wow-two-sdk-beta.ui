<script lang="ts">
import type { VNode } from 'vue';
import type { OverlayPosition } from '../../../foundation/styles';
import type { ToastSimpleVariants } from '../toastSimple/ToastSimple.variants';

export type ToastSeverity = NonNullable<ToastSimpleVariants['severity']>;

/**
 * A renderable slice of a toast. These travel through the imperative
 * `toastHost.toast()` payload, not through a slot, so a caller who wants
 * markup builds it with `h()`.
 */
export type ToastNode = string | VNode;

export interface ToastOptions {
  title?: ToastNode;
  description?: ToastNode;
  icon?: ToastNode;
  severity?: ToastSeverity;
  /** ms before auto-dismiss. Default: ToastHost's `defaultDuration`. `Infinity` = sticky. */
  duration?: number;
  action?: ToastNode;
  /**
   * Fully custom body — replaces the default `Toast` chrome (icon/title/description/close).
   * Still animates + auto-dismisses; the content owns its close via the returned id.
   */
  content?: ToastNode;
  /**
   * Fired when the toast is removed — auto-dismiss, close button, `dismiss(id)`, or `dismissAll()`.
   * Not fired on a dedup-update. For undo cleanup / analytics.
   */
  onDismiss?: () => void;
  /**
   * Dedup key — a `toast` whose `key` is already showing updates that toast in place,
   * refreshing its timer instead of stacking a duplicate.
   */
  key?: string;
}

/** Content for a `toastHost.promise` phase — a title string, or a full partial options object. */
export type ToastContent = string | Partial<ToastOptions>;

/**
 * Options for `toastHost.promise` — loading / success / error content
 * (success + error may be a fn of the settled value).
 */
export interface ToastPromiseOptions<T> {
  loading: ToastContent;
  success: ToastContent | ((value: T) => ToastContent);
  error: ToastContent | ((err: unknown) => ToastContent);
  /** Auto-dismiss (ms) for the settled toast; defaults to the ToastHost's `defaultDuration`. */
  duration?: number;
}

function normalizeContent(content: ToastContent): Partial<ToastOptions> {
  return typeof content === 'string' ? { title: content } : content;
}

interface ToastEntry extends ToastOptions {
  id: string;
  /** Bumped on every `update` / dedup so the viewport can reset that toast's auto-dismiss timer. */
  nonce: number;
}

type Listener = (toasts: ReadonlyArray<ToastEntry>) => void;

class ToastHostStore {
  private items: ReadonlyArray<ToastEntry> = [];
  private listeners = new Set<Listener>();
  private idSeq = 0;

  toast(opts: ToastOptions): string {
    if (opts.key !== undefined) {
      const existing = this.items.find((t) => t.key === opts.key);
      if (existing) {
        this.update(existing.id, opts);
        return existing.id;
      }
    }
    const id = `t_${++this.idSeq}`;
    this.items = [...this.items, { id, ...opts, nonce: 0 }];
    this.emit();
    return id;
  }

  /** Merges a patch into an existing toast (content + severity + duration), refreshing its timer. */
  update(id: string, patch: Partial<ToastOptions>): void {
    this.items = this.items.map((t) => (t.id === id ? { ...t, ...patch, nonce: t.nonce + 1 } : t));
    this.emit();
  }

  /** Shows a sticky loading toast; returns the full content-update and promise settlement chain. */
  promise<T>(promise: Promise<T>, opts: ToastPromiseOptions<T>): Promise<T> {
    const id = this.toast({ ...normalizeContent(opts.loading), severity: 'info', duration: Infinity });
    const settle = (content: ToastContent, severity: ToastSeverity) =>
      this.update(id, { ...normalizeContent(content), severity, duration: opts.duration });
    return promise.then(
      (value) => {
        settle(typeof opts.success === 'function' ? opts.success(value) : opts.success, 'success');
        return value;
      },
      (err: unknown) => {
        settle(typeof opts.error === 'function' ? opts.error(err) : opts.error, 'danger');
        throw err;
      },
    );
  }

  dismiss(id: string): void {
    const entry = this.items.find((t) => t.id === id);
    this.items = this.items.filter((t) => t.id !== id);
    try {
      entry?.onDismiss?.();
    } finally {
      this.emit();
    }
  }

  dismissAll(): void {
    const gone = this.items;
    this.items = [];
    try {
      for (const t of gone) t.onDismiss?.();
    } finally {
      this.emit();
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.items);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    for (const fn of this.listeners) fn(this.items);
  }
}

export const toastHost = new ToastHostStore();

/**
 * The imperative toast API, bound to the app-wide store. A plain object — the
 * store is a module singleton, so there is nothing per-instance to memoize.
 */
export function useToastHost() {
  return {
    toast: (opts: ToastOptions) => toastHost.toast(opts),
    update: (id: string, patch: Partial<ToastOptions>) => toastHost.update(id, patch),
    promise: <T,>(promise: Promise<T>, opts: ToastPromiseOptions<T>) => toastHost.promise(promise, opts),
    dismiss: (id: string) => toastHost.dismiss(id),
    dismissAll: () => toastHost.dismissAll(),
  };
}

const PositionClasses: Record<OverlayPosition, string> = {
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
};

/**
 * Enter/exit animation per position, gated on `data-state` (set by `Presence`)
 * and `motion-safe:` so reduced-motion users get an instant swap. Corner
 * toasts slide along their horizontal edge; centered toasts slide along the
 * vertical axis they're anchored to. Exit anims are shorter (`--duration-fast`).
 */
const MotionClasses: Record<OverlayPosition, string> = {
  'top-right':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-right) motion-safe:data-[state=closed]:animate-(--animate-slide-out-right) motion-reduce:animate-none',
  'top-left':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-left) motion-safe:data-[state=closed]:animate-(--animate-slide-out-left) motion-reduce:animate-none',
  'top-center':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-top) motion-safe:data-[state=closed]:animate-(--animate-slide-out-top) motion-reduce:animate-none',
  'bottom-right':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-right) motion-safe:data-[state=closed]:animate-(--animate-slide-out-right) motion-reduce:animate-none',
  'bottom-left':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-left) motion-safe:data-[state=closed]:animate-(--animate-slide-out-left) motion-reduce:animate-none',
  'bottom-center':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-bottom) motion-safe:data-[state=closed]:animate-(--animate-slide-out-bottom) motion-reduce:animate-none',
};

export interface ToastHostProps {
  readonly position?: OverlayPosition;
  readonly max?: number;
  /** The default auto-dismiss delay in ms; per-toast `duration` overrides. Default 5000. `Infinity` to disable. */
  readonly defaultDuration?: number;
  readonly canPauseOnHover?: boolean;
  readonly gap?: number;
}

interface VisibleToast extends ToastEntry {
  resolvedDuration: number;
}
</script>

<script setup lang="ts">
import { useLocale } from '../../../foundation/i18n';
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  useAttrs,
  watch,
  type PropType,
} from 'vue';
import { cn, OverlayPosition as OverlayPositionToken } from '../../../foundation/styles';
import { Announce, Portal, Presence } from '../../../foundation/primitives';
import Toast from '../toast/Toast.vue';

const locale = useLocale();

/** Renders a `ToastNode` — either a plain string or a caller-built VNode. */
const ToastNodeView = defineComponent({
  name: 'ToastNodeView',
  props: { node: { type: [String, Object] as PropType<ToastNode>, required: true } },
  setup: (nodeProps) => () => nodeProps.node,
});

/**
 * Renders the toast viewport — subscribes to the global `toastHost` store and stacks `Toast` cards.
 * Mount once, per app.
 *
 * A caller's `class` attr lands on the stack container.
 */
defineOptions({ name: 'ToastHost', inheritAttrs: false });

const props = withDefaults(defineProps<ToastHostProps>(), {
  position: OverlayPositionToken.BottomRight,
  max: 5,
  defaultDuration: 5000,
  canPauseOnHover: true,
  gap: 8,
});

const attrs = useAttrs();

const items = shallowRef<ReadonlyArray<ToastEntry>>([]);
const hovered = ref(false);
const focused = ref(false);
const paused = computed(() => props.canPauseOnHover && (hovered.value || focused.value));

/* Non-reactive state — mutated across ticks, never rendered. */
const timers = new Map<string, number>();
const remaining = new Map<string, number>();
const startedAt = new Map<string, number>();
const nonces = new Map<string, number>();

let unsubscribe: (() => void) | undefined;
onMounted(() => {
  unsubscribe = toastHost.subscribe((next) => {
    items.value = next;
  });
});

// Visible window (FIFO).
const visible = computed<ReadonlyArray<VisibleToast>>(() =>
  items.value.slice(0, props.max).map((t) => ({
    ...t,
    resolvedDuration: t.duration ?? props.defaultDuration,
  })),
);
const visibleIds = computed(() => new Set(visible.value.map((v) => v.id)));

// Toasts that just left `visible` (dismissed, or pushed out of the FIFO
// window) but must still play their exit animation. Kept mounted with
// `data-state="closed"` until `Presence` unmounts the child — the `@vue:unmounted`
// hook below then prunes the entry here.
const exiting = shallowRef<ReadonlyArray<VisibleToast>>([]);
let prevVisible: ReadonlyArray<VisibleToast> = [];

watch(
  visibleIds,
  (ids) => {
    const gone = prevVisible.filter((p) => !ids.has(p.id));
    prevVisible = visible.value;
    const current = exiting.value;
    const known = new Set(current.map((e) => e.id));
    // Add newly-gone toasts; drop any that re-entered `visible`.
    const merged = [...current, ...gone.filter((g) => !known.has(g.id))].filter((e) => !ids.has(e.id));
    if (merged.length !== current.length || !merged.every((e, i) => e.id === current[i]?.id)) {
      exiting.value = merged;
    }
  },
  { immediate: true, flush: 'post' },
);

const removeExiting = (id: string) => {
  exiting.value = exiting.value.filter((e) => e.id !== id);
};

// Visible (present) first, then the ones animating out.
const rendered = computed<Array<VisibleToast & { present: boolean }>>(() => [
  ...visible.value.map((v) => ({ ...v, present: true })),
  ...exiting.value.map((e) => ({ ...e, present: false })),
]);

const latestTitle = computed(() => {
  const last = visible.value[visible.value.length - 1];
  if (typeof last?.title === 'string') return last.title;
  if (typeof last?.description === 'string') return last.description;
  return '';
});

// Schedule auto-dismiss timers.
watch(
  [items, () => props.max, () => props.defaultDuration, paused],
  () => {
    const ids = visibleIds.value;
    // Clear timers for items that are no longer visible.
    for (const [id, handle] of timers) {
      if (!ids.has(id)) {
        window.clearTimeout(handle);
        timers.delete(id);
        remaining.delete(id);
        startedAt.delete(id);
      }
    }
    for (const id of nonces.keys()) {
      if (!ids.has(id)) nonces.delete(id);
    }
    if (paused.value) return;
    // A content update / dedup bumps `nonce` — clear that toast's timer so it reschedules fresh.
    for (const v of visible.value) {
      const seen = nonces.get(v.id);
      if (seen !== undefined && seen !== v.nonce) {
        const handle = timers.get(v.id);
        if (handle !== undefined) window.clearTimeout(handle);
        timers.delete(v.id);
        remaining.delete(v.id);
        startedAt.delete(v.id);
      }
      nonces.set(v.id, v.nonce);
    }
    for (const v of visible.value) {
      if (v.resolvedDuration === Infinity) continue;
      if (timers.has(v.id)) continue;
      const left = remaining.get(v.id) ?? v.resolvedDuration;
      const handle = window.setTimeout(() => {
        toastHost.dismiss(v.id);
      }, left);
      timers.set(v.id, handle);
      startedAt.set(v.id, Date.now());
      remaining.set(v.id, left);
    }
  },
  { immediate: true, flush: 'post' },
);

// Cleanup on unmount.
onUnmounted(() => {
  unsubscribe?.();
  for (const handle of timers.values()) window.clearTimeout(handle);
  timers.clear();
});

watch(
  paused,
  (isPaused) => {
    if (!isPaused) return;
    for (const [id, handle] of timers) {
      window.clearTimeout(handle);
      const start = startedAt.get(id) ?? Date.now();
      remaining.set(id, Math.max(0, (remaining.get(id) ?? 0) - (Date.now() - start)));
    }
    timers.clear();
  },
  { flush: 'sync' },
);

watch(
  () => rendered.value.length,
  (count) => {
    if (count === 0) {
      hovered.value = false;
      focused.value = false;
    }
  },
);

function onFocusout(event: FocusEvent): void {
  const stack = event.currentTarget as HTMLElement;
  if (!(event.relatedTarget instanceof Node) || !stack.contains(event.relatedTarget)) focused.value = false;
}

const stackClasses = computed(() =>
  cn(
    'pointer-events-none fixed z-toast flex flex-col',
    PositionClasses[props.position],
    attrs.class as string | undefined,
  ),
);

const itemClasses = computed(() => cn('pointer-events-auto w-80', MotionClasses[props.position]));

/** Vue does not auto-suffix numeric style values with `px`. */
const stackStyle = computed(() => ({ gap: `${props.gap}px` }));
</script>

<template>
  <Portal>
    <div
      v-if="rendered.length > 0"
      :aria-label="locale.t('ToastHost.notifications', undefined, 'Notifications')"
      :style="stackStyle"
      :class="stackClasses"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
      @focusin="focused = true"
      @focusout="onFocusout"
    >
      <Presence v-for="t in rendered" :key="t.id" :is-present="t.present">
        <!--
          `Presence` clones `data-state` onto this node and keeps it mounted
          until the exit animation ends; the `@vue:unmounted` hook is that
          "exit finished" signal (the read-only `Presence` API exposes no
          callback).
        -->
        <div :class="itemClasses" @vue:unmounted="t.present ? undefined : removeExiting(t.id)">
          <ToastNodeView v-if="t.content" :node="t.content" />
          <Toast v-else :severity="t.severity" @close="toastHost.dismiss(t.id)">
            <template v-if="t.icon" #icon><ToastNodeView :node="t.icon" /></template>
            <template v-if="t.title" #title><ToastNodeView :node="t.title" /></template>
            <template v-if="t.description" #description>
              <ToastNodeView :node="t.description" />
            </template>
            <template v-if="t.action" #actions><ToastNodeView :node="t.action" /></template>
          </Toast>
        </div>
      </Presence>
    </div>
    <Announce politeness="polite">{{ latestTitle }}</Announce>
  </Portal>
</template>
