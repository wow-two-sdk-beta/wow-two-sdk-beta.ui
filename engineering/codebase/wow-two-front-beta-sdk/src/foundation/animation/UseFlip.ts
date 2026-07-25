// The React binding for FLIP: snapshot geometry across a render, animate the difference.
//
// WHY `useLayoutEffect` AND NOT `useEffect` — this is the whole reason the hook exists:
//
//   React commits the DOM change, the browser paints, THEN `useEffect` runs. A rect measured there is the
//   post-paint rect, so the user has already SEEN the element at its new position; the FLIP then yanks it back
//   to the old one and animates forward, which reads as a visible jump-and-slide. `useLayoutEffect` runs after
//   the commit but BEFORE paint, so the invert lands in the same frame as the layout change and the first thing
//   the user sees is the animation's first frame. There is no correct `useEffect` version of this hook.
//
// HOW THE SNAPSHOT SURVIVES THE RENDER: there is no "before the change" callback in React. Instead the hook
// measures at the END of every layout effect and keeps that rect in a ref. On the next deps change the ref
// still holds the PREVIOUS commit's geometry — that is "First" — and a fresh measurement is "Last". So the
// snapshot is always one commit old by construction, which is exactly what FLIP wants.
//
// The first run has no previous rect and therefore animates nothing: a mount is an enter transition, which is
// `foundation/primitives`' `Presence`, not this slice.
//
// Reduced motion is read here (`useReducedMotion`) rather than inside `playFlip`, keeping the pure layer
// React-free. An explicit `reducedMotion` option still wins, so a consumer can force either behaviour.

import { useLayoutEffect, useRef, type DependencyList, type RefObject } from 'react';

import { useReducedMotion } from '../hooks';
import { measureRect, playFlip, type FlipOptions, type RectLike } from './Flip';

/** Tunes a `useFlip` binding. Same knobs as `playFlip`, plus an on/off switch for the whole binding. */
export interface UseFlipOptions extends FlipOptions {
  /** Whether the binding animates at all. `false` still keeps the snapshot current. Defaults to `true`. */
  readonly enabled?: boolean;
}

/**
 * FLIP-animates a single element across a layout-affecting change.
 *
 * Pass the deps that cause the change (the sort key, the collapsed flag, the filter). On every change the hook
 * animates the element from where it was in the previous commit to where it is now, before the browser paints.
 *
 * SSR-safe: with no element on the ref it measures nothing and animates nothing.
 *
 * @param ref A ref to the element whose layout changes.
 * @param deps The dependency list whose change signals "the layout just moved".
 * @param options Duration, easing, the reduced-motion override, and `enabled`.
 */
export function useFlip<T extends Element = HTMLElement>(
  ref: RefObject<T | null>,
  deps: DependencyList,
  options: UseFlipOptions = {},
): void {
  const prefersReducedMotion = useReducedMotion();
  const previousRectRef = useRef<RectLike | null>(null);

  // Read from a ref so a consumer never has to memoize the options object — the effect must fire on `deps`
  // alone, otherwise a fresh `{ duration: 200 }` literal each render would re-run (and re-animate) every time.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const reducedMotionRef = useRef(prefersReducedMotion);
  reducedMotionRef.current = prefersReducedMotion;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Measure BEFORE playing: `playFlip` re-reads the same (still-clean) layout, and doing it in this order
    // means the stored snapshot is the element's real post-change box, never a transformed one.
    const last = measureRect(element);
    const first = previousRectRef.current;
    previousRectRef.current = last;

    const { enabled = true, reducedMotion, ...flip } = optionsRef.current;
    if (!enabled || !first) return;

    const handle = playFlip(element, first, {
      ...flip,
      reducedMotion: reducedMotion ?? reducedMotionRef.current,
    });
    return () => handle.cancel();
    // The consumer owns this list — it names the state whose change moves the element. `ref` and the options
    // are read through refs precisely so they cannot (and must not) widen it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
