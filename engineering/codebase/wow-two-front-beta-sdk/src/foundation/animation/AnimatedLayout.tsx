// The multi-child FLIP: a container that animates its children to their new positions whenever their order or
// count changes. List reordering, filtering, sorting, drag-drop settle.
//
// DELIBERATELY SMALL. It is `useFlip`'s loop, not a layout engine — no enter/exit choreography, no shared-element
// transitions, no spring physics. Children that mount or unmount simply appear/disappear at their final spot
// (`Presence` is the primitive for enter/exit); only the SURVIVING children are animated, which is precisely the
// case CSS cannot do at all.
//
// NON-OBVIOUS DECISIONS:
//
//  - IDENTITY COMES FROM `key`, NOT DOM ORDER. Order is the thing that changes, so a positional index cannot
//    identify a child across renders. Each child is cloned with a `data-flip-key` carrying its React key, and
//    rects are stored in a `Map` under it. The cost: a child must forward unknown props to its DOM node —
//    intrinsic elements (`<li>`, `<div>`) do this for free, a custom component must spread `...props`. An
//    unkeyed child gets a positional key from `Children.toArray` and so is not tracked across a reorder; that
//    is inherent (React cannot track it either), not a gap to fix here.
//
//  - NO DEPENDENCY ARRAY on the layout effect. The trigger is "the children rendered differently", which is not
//    expressible as deps — comparing children by value each render costs more than the two `getBoundingClientRect`
//    reads the effect does, and `playFlip` short-circuits when nothing moved.
//
//  - MEASURE ALL, THEN PLAY ALL. Two passes, not one interleaved loop: starting an animation on child 1 dirties
//    style state, so measuring child 2 afterwards would force a fresh layout recalc per child (layout thrash on
//    a long list).

import {
  Children,
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';

import { useReducedMotion } from '../hooks';
import type { AnimationHandle } from './Animate';
import { measureRect, playFlip, type FlipOptions, type RectLike } from './Flip';

/** The attribute carrying each child's React key onto its DOM node, so rects survive a reorder. */
const FLIP_KEY_ATTRIBUTE = 'data-flip-key';

/** Props for `AnimatedLayout`. */
export interface AnimatedLayoutProps extends FlipOptions {
  /** The children to track. Each should be keyed and should forward props to a DOM element. */
  readonly children?: ReactNode;

  /** Whether layout animation is active. Defaults to `true`. */
  readonly enabled?: boolean;

  /** Class name for the container element. */
  readonly className?: string;

  /** Inline styles for the container element. */
  readonly style?: CSSProperties;
}

/**
 * FLIP-animates its children to their new positions when the list reorders, filters, or resizes.
 *
 * Renders one plain `<div>` wrapper and clones each child with a `data-flip-key`; all layout (flex, grid, list)
 * stays with the consumer via `className`/`style`.
 *
 * Under `prefers-reduced-motion` — or `enabled={false}`, or an explicit `reducedMotion` — children jump
 * straight to their new positions with no transform applied and no residue left behind.
 *
 * @param props Children, the motion options, and container styling.
 * @returns The wrapper element.
 */
export function AnimatedLayout({
  children,
  enabled = true,
  className,
  style,
  duration,
  easing,
  reducedMotion,
}: AnimatedLayoutProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rectsRef = useRef<Map<string, RectLike>>(new Map());
  const prefersReducedMotion = useReducedMotion();

  const optionsRef = useRef<FlipOptions & { enabled: boolean }>({ duration, easing, reducedMotion, enabled });
  optionsRef.current = { duration, easing, reducedMotion, enabled };

  const reducedMotionRef = useRef(prefersReducedMotion);
  reducedMotionRef.current = prefersReducedMotion;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Pass 1 — measure every tracked child while layout is still clean.
    const measured: Array<{ element: Element; key: string; rect: RectLike }> = [];
    for (const element of Array.from(container.children)) {
      const key = element.getAttribute(FLIP_KEY_ATTRIBUTE);
      if (key === null) continue;
      const rect = measureRect(element);
      if (rect) measured.push({ element, key, rect });
    }

    const previous = rectsRef.current;
    const next = new Map<string, RectLike>();
    for (const { key, rect } of measured) next.set(key, rect);
    rectsRef.current = next;

    const options = optionsRef.current;
    if (!options.enabled) return;

    // Pass 2 — play. A child with no previous rect is new; it stays put at its final position.
    const handles: AnimationHandle[] = [];
    for (const { element, key } of measured) {
      const first = previous.get(key);
      if (!first) continue;
      handles.push(
        playFlip(element, first, {
          duration: options.duration,
          easing: options.easing,
          reducedMotion: options.reducedMotion ?? reducedMotionRef.current,
        }),
      );
    }

    return () => {
      for (const handle of handles) handle.cancel();
    };
  });

  return (
    <div ref={containerRef} className={className} style={style}>
      {Children.toArray(children).map((child) =>
        isValidElement(child) && child.key !== null
          ? cloneElement(child, { [FLIP_KEY_ATTRIBUTE]: child.key } as Partial<typeof child.props>)
          : child,
      )}
    </div>
  );
}
