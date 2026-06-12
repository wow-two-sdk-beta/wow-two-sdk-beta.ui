import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from 'react';
import { useComposedRefs } from '../../utils/composeRefs';

export interface PresenceProps {
  /** Whether the content should be present. Toggle false to trigger exit. */
  present: boolean;
  /** Single React element child — receives `ref` and `data-state` ("open" | "closed"). */
  children: ReactElement;
}

function parseTimes(value: string): number[] {
  return value.split(',').map((part) => {
    const trimmed = part.trim();
    const ms = trimmed.endsWith('ms') ? parseFloat(trimmed) : parseFloat(trimmed) * 1000;
    return Number.isFinite(ms) ? ms : 0;
  });
}

/** Longest computed transition/animation (duration + delay) in ms. */
function getTotalDurationMs(node: HTMLElement): number {
  const cs = getComputedStyle(node);
  const maxOf = (durations: number[], delays: number[]) =>
    durations.reduce(
      (max, duration, i) => Math.max(max, duration + (delays[i % delays.length] ?? 0)),
      0,
    );
  return Math.max(
    maxOf(parseTimes(cs.transitionDuration), parseTimes(cs.transitionDelay)),
    maxOf(parseTimes(cs.animationDuration), parseTimes(cs.animationDelay)),
  );
}

/**
 * Defer unmount until the child's exit animation/transition finishes.
 * Pass `present={false}` to start the exit; the child stays mounted with
 * `data-state="closed"` until its own `animationend`/`transitionend` fires
 * (or a computed-duration timeout as a fallback). If no exit animation
 * actually starts, the child unmounts immediately. On enter, the child
 * mounts with `data-state="closed"` and flips to `"open"` on the next
 * frame so enter transitions play.
 */
export function Presence({ present, children }: PresenceProps): ReactElement | null {
  const [rendered, setRendered] = useState(present);
  const [dataState, setDataState] = useState<'open' | 'closed'>('closed');
  const ref = useRef<HTMLElement | null>(null);

  const child = isValidElement(children)
    ? (children as ReactElement<{ ref?: Ref<HTMLElement> }> & { ref?: Ref<HTMLElement> })
    : null;
  const composedRef = useComposedRefs(ref, child?.ref);

  // Enter — mount closed, then flip to open on the next frame (double rAF
  // so the closed styles are committed and painted first) to run transitions.
  useEffect(() => {
    if (!present) return;
    if (!rendered) {
      setRendered(true);
      return;
    }
    if (dataState === 'open') return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setDataState('open'));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [present, rendered, dataState]);

  // Exit — flip to closed, then unmount when the child's own exit
  // animation/transition ends; immediately if none starts within a frame
  // window; or after the computed total duration as a safety net.
  useEffect(() => {
    if (present) return;
    const node = ref.current;
    if (!node) {
      setRendered(false);
      return;
    }
    let started = false;
    let timer: number | undefined;
    let raf2 = 0;
    const onStart = (event: Event) => {
      if (event.target === node) started = true;
    };
    const onEnd = (event: Event) => {
      if (event.target === node) setRendered(false);
    };
    node.addEventListener('animationstart', onStart);
    node.addEventListener('transitionrun', onStart);
    node.addEventListener('animationend', onEnd);
    node.addEventListener('transitionend', onEnd);
    // Flip the DOM synchronously so the start-detection window below is
    // deterministic; React re-renders to the same value via setDataState.
    node.setAttribute('data-state', 'closed');
    setDataState('closed');
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const animating = started || (node.getAnimations?.().length ?? 0) > 0;
        if (!animating) {
          setRendered(false);
          return;
        }
        timer = window.setTimeout(() => setRendered(false), getTotalDurationMs(node) + 100);
      });
    });
    return () => {
      node.removeEventListener('animationstart', onStart);
      node.removeEventListener('transitionrun', onStart);
      node.removeEventListener('animationend', onEnd);
      node.removeEventListener('transitionend', onEnd);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [present]);

  if (!rendered || !child) return null;
  return cloneElement(child, {
    ref: composedRef,
    'data-state': dataState,
  } as Partial<typeof child.props>);
}
