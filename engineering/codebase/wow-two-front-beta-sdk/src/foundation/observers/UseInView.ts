// `useInView` — "is this element on screen?" as a boolean, over `observeIntersection`. The primitive under
// lazy-loading, reveal-on-scroll, infinite-scroll sentinels, and autoplay-when-visible.
//
// THE EFFECT HAS NO DEPENDENCY ARRAY, ON PURPOSE. A `RefObject` mutation does not re-render, so React can never
// tell this hook that `ref.current` now points at a different node — the parent conditionally rendered a
// different child, a list re-keyed, an element moved behind a `Suspense` boundary. An effect keyed on `[ref]`
// sees the same stable ref object forever and keeps observing a node that was detached from the document three
// renders ago, reporting a stale `false` for an element that IS on screen. Running after EVERY render and
// diffing `ref.current` against what is actually observed is what closes that hole. The diff makes the common
// case free: same node, same options ⇒ the effect returns immediately without touching the observer.
//
// CLEANUP IS A SEPARATE `[]` EFFECT, and it has to be. A cleanup returned from the no-deps effect would run after
// every render, tearing the observer down and rebuilding it constantly — the exact churn this design avoids.
// Teardown belongs to unmount, and the re-observe path disposes explicitly before it re-subscribes.
//
// UNSUPPORTED FAILS OPEN, AND FAILS OPEN FROM AN EFFECT. `inView: false` is right while the answer is unknown but
// wrong forever: reveal-on-scroll content stays invisible and lazy images never load, i.e. the page is broken for
// the user with the oldest browser. So when `IntersectionObserver` is missing the hook reports `true`
// (`fallbackInView`, opt-out) and shows everything. It does that from the EFFECT, never from the initial state,
// because effects do not run on the server — computing the fallback during render would make the server emit
// `true` and the client hydrate `false`, which is a hydration mismatch.
//
// `once` DISCONNECTS PERMANENTLY, including across a later ref change. A reveal that un-reveals is a bug, and a
// lazy-loaded image does not need un-loading; keeping the observer alive after the first hit is pure cost on the
// scroll path where cost is most visible.

import { useEffect, useRef, useState, type RefObject } from 'react';

import {
  intersectionSignature,
  observeIntersection,
  supportsIntersectionObserver,
  type Disposer,
  type IntersectionOptions,
} from './ObserveIntersection';

/** Root/margin/threshold plus the lifecycle knobs the hook adds. */
export interface UseInViewOptions extends IntersectionOptions {
  /**
   * Stop observing permanently after the first intersection. The state stays `true` from then on, even if the
   * element scrolls away or `ref` is later pointed at a different node. Use for anything that should happen
   * once — lazy loads, entrance animations, "seen" analytics.
   */
  readonly once?: boolean;

  /** Suspend observation without unmounting. Flipping it back re-observes the current `ref.current`. */
  readonly disabled?: boolean;

  /**
   * What `inView` reports when `IntersectionObserver` does not exist in this environment. Defaults to `true`
   * (fail open — show the content). Set `false` only when hidden is the safer wrong answer.
   */
  readonly fallbackInView?: boolean;
}

/** What `useInView` returns. */
export interface InViewState {
  /** Whether the element currently meets the threshold. */
  readonly inView: boolean;

  /**
   * The entry behind the current value — `intersectionRatio`, `boundingClientRect`, `time`. `null` before the
   * observer's first callback and whenever the API is unavailable.
   */
  readonly entry: IntersectionObserverEntry | null;
}

/** Pre-observation state. Module-level so the identity is stable across hook instances and renders. */
const INITIAL_STATE: InViewState = { inView: false, entry: null };

/**
 * Tracks whether the element behind `ref` is intersecting the root.
 *
 * The first callback arrives asynchronously (a frame or so after mount), so `inView` is `false` on the very
 * first render even for an element sitting in the middle of the viewport — assert against it with `waitFor`,
 * never synchronously.
 *
 * @param ref Points at the element to watch. May change which element it points at between renders.
 * @param options Root, margin, threshold, plus `once` / `disabled` / `fallbackInView`.
 * @returns `{ inView, entry }`, re-rendering only when `isIntersecting` or `intersectionRatio` actually changes.
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  options?: UseInViewOptions,
): InViewState {
  const [state, setState] = useState<InViewState>(INITIAL_STATE);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const disposeRef = useRef<Disposer | null>(null);
  const observedRef = useRef<Element | null>(null);
  const signatureRef = useRef<string | null>(null);
  const rootRef = useRef<Element | Document | null>(null);
  const settledRef = useRef(false);

  const signature = intersectionSignature(options);
  const root = options?.root ?? null;
  const disabled = options?.disabled ?? false;

  // No dependency array — runs after every render and diffs; see the header. The rule's infinite-update warning
  // does not apply: every `setState` path here is preceded by a re-subscribe, and the next run of this effect
  // sees an unchanged element+signature+root and returns before reaching one.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a dep array would defeat the ref-identity diff
  useEffect(() => {
    if (settledRef.current) return; // `once` already fired; this hook is done for good.

    const element = disabled ? null : ref.current;
    const unchanged =
      element === observedRef.current && signature === signatureRef.current && root === rootRef.current;
    if (unchanged) return;

    disposeRef.current?.();
    disposeRef.current = null;
    observedRef.current = element;
    signatureRef.current = signature;
    rootRef.current = root;

    if (!element) return;

    if (!supportsIntersectionObserver()) {
      const fallback = optionsRef.current?.fallbackInView ?? true;
      setState((prev) => (prev.inView === fallback && prev.entry === null ? prev : { inView: fallback, entry: null }));
      return;
    }

    disposeRef.current = observeIntersection(
      element,
      (entry) => {
        setState((prev) =>
          prev.entry?.isIntersecting === entry.isIntersecting &&
          prev.entry?.intersectionRatio === entry.intersectionRatio
            ? prev
            : { inView: entry.isIntersecting, entry },
        );

        if (entry.isIntersecting && optionsRef.current?.once === true) {
          settledRef.current = true;
          disposeRef.current?.();
          disposeRef.current = null;
          observedRef.current = null;
        }
      },
      optionsRef.current,
    );
  });

  useEffect(
    () => () => {
      disposeRef.current?.();
      disposeRef.current = null;
      observedRef.current = null;
      signatureRef.current = null;
      rootRef.current = null;
    },
    [],
  );

  return state;
}
