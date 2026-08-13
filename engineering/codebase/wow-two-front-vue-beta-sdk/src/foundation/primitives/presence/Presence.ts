import { cloneVNode, defineComponent, shallowRef, watch, type VNode } from 'vue';
import { renderableChildren } from '../slot/Slot';

export interface PresenceProps {
  /** The presence flag — toggle false to trigger exit. */
  isPresent: boolean;
}

function parseTimes(value: string): ReadonlyArray<number> {
  return value.split(',').map((part) => {
    const trimmed = part.trim();
    const ms = trimmed.endsWith('ms') ? parseFloat(trimmed) : parseFloat(trimmed) * 1000;
    return Number.isFinite(ms) ? ms : 0;
  });
}

/** Longest computed transition/animation (duration + delay) in ms. */
function getTotalDurationMs(node: HTMLElement): number {
  const cs = getComputedStyle(node);
  const maxOf = (durations: ReadonlyArray<number>, delays: ReadonlyArray<number>) =>
    durations.reduce(
      (max, duration, i) => Math.max(max, duration + (delays[i % delays.length] ?? 0)),
      0,
    );
  return Math.max(
    maxOf(parseTimes(cs.transitionDuration), parseTimes(cs.transitionDelay)),
    maxOf(parseTimes(cs.animationDuration), parseTimes(cs.animationDelay)),
  );
}

/** A function ref may receive a component's public instance; the DOM node is what the timing logic needs. */
function toElement(value: unknown): HTMLElement | null {
  if (value instanceof HTMLElement) return value;
  const el = (value as { $el?: unknown } | null)?.$el;
  return el instanceof HTMLElement ? el : null;
}

/**
 * Defer unmount until the child's exit animation/transition finishes.
 * Pass `is-present="false"` to start the exit; the child stays mounted with
 * `data-state="closed"` until its own `animationend`/`transitionend` fires
 * (or a computed-duration timeout as a fallback). If no exit animation
 * actually starts, the child unmounts immediately. On enter, the child
 * mounts with `data-state="closed"` and flips to `"open"` on the next
 * frame so enter transitions play.
 *
 * Deliberately not Vue's `<Transition>`: this primitive drives unmount off the
 * child's *own* computed timing rather than off CSS class hooks, which is what
 * lets a consumer style the exit entirely in their own stylesheet.
 *
 * Both effects use `flush: 'post'`, the analogue of React's `useEffect` here —
 * the DOM node must exist before the timing window opens.
 */
export const Presence = defineComponent({
  name: 'Presence',
  props: {
    isPresent: { type: Boolean, required: true },
  },
  setup(props, { slots }) {
    const rendered = shallowRef(props.isPresent);
    const dataState = shallowRef<'open' | 'closed'>('closed');
    const node = shallowRef<HTMLElement | null>(null);

    const setNode = (value: unknown): void => {
      node.value = toElement(value);
    };

    // Enter — mount closed, then flip to open on the next frame (double rAF
    // so the closed styles are committed and painted first) to run transitions.
    watch(
      [() => props.isPresent, rendered, dataState],
      ([isPresent], _previous, onCleanup) => {
        if (!isPresent) return;
        if (!rendered.value) {
          rendered.value = true;
          return;
        }
        if (dataState.value === 'open') return;
        /* `immediate: true` makes this watcher run during SSR too (Vue skips only the
           non-immediate post-flush ones), and there is no `requestAnimationFrame` on the
           server. Bail rather than throw: the server emits `data-state="closed"`, which is
           exactly what the client's first render produces, so hydration still matches and
           this same watcher runs the enter on the client. */
        if (typeof requestAnimationFrame === 'undefined') return;
        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => {
            dataState.value = 'open';
          });
        });
        onCleanup(() => {
          cancelAnimationFrame(raf1);
          cancelAnimationFrame(raf2);
        });
      },
      { immediate: true, flush: 'post' },
    );

    // Exit — flip to closed, then unmount when the child's own exit
    // animation/transition ends; immediately if none starts within a frame
    // window; or after the computed total duration as a safety net.
    watch(
      () => props.isPresent,
      (isPresent, _previous, onCleanup) => {
        if (isPresent) return;
        const el = node.value;
        if (!el) {
          rendered.value = false;
          return;
        }
        let started = false;
        let timer: number | undefined;
        let raf2 = 0;
        const onStart = (event: Event) => {
          if (event.target === el) started = true;
        };
        const onEnd = (event: Event) => {
          if (event.target === el) rendered.value = false;
        };
        el.addEventListener('animationstart', onStart);
        el.addEventListener('transitionrun', onStart);
        el.addEventListener('animationend', onEnd);
        el.addEventListener('transitionend', onEnd);
        // Flip the DOM synchronously so the start-detection window below is
        // deterministic; the next render settles on the same value.
        el.setAttribute('data-state', 'closed');
        dataState.value = 'closed';
        const raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => {
            const animating = started || (el.getAnimations?.().length ?? 0) > 0;
            if (!animating) {
              rendered.value = false;
              return;
            }
            timer = window.setTimeout(() => {
              rendered.value = false;
            }, getTotalDurationMs(el) + 100);
          });
        });
        onCleanup(() => {
          el.removeEventListener('animationstart', onStart);
          el.removeEventListener('transitionrun', onStart);
          el.removeEventListener('animationend', onEnd);
          el.removeEventListener('transitionend', onEnd);
          cancelAnimationFrame(raf1);
          cancelAnimationFrame(raf2);
          if (timer !== undefined) window.clearTimeout(timer);
        });
      },
      { immediate: true, flush: 'post' },
    );

    return (): VNode | null => {
      if (!rendered.value) return null;
      const child = renderableChildren(slots.default?.())[0];
      if (!child) return null;
      // `mergeRef` composes our tracking ref with any ref the consumer already
      // put on the child, the job React's `useComposedRefs` did here.
      return cloneVNode(child, { 'data-state': dataState.value, ref: setNode }, true);
    };
  },
});
