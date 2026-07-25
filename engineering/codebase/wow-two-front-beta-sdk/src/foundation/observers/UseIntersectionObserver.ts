// `useIntersectionObserver` — the MULTI-element form: many targets, ONE observer, one callback.
//
// AN OBSERVER PER LIST ITEM IS THE CLASSIC PERFORMANCE MISTAKE THIS HOOK EXISTS TO PREVENT. Reaching for
// `useInView` inside a row component feels natural and scales badly: a 500-row table builds 500 observers, and
// the browser then walks 500 separate observation sets on every scroll-driven intersection pass instead of one.
// The API is explicitly built for the many-target case — `observe()` takes an element, and a single observer
// delivers ALL of their entries in one batched callback. That batching is the win, and it only exists if the
// targets share an observer.
//
// THE OBSERVER SURVIVES TARGET CHURN. Rows mount and unmount constantly; rebuilding the observer for each would
// throw away the batching AND re-fire an initial callback for every surviving target. So the effect diffs the
// live target set against what is currently observed and issues only `observe()` / `unobserve()` for the delta.
// A new observer is constructed exactly once per options change — nothing else.
//
// NO `once` HERE, ON PURPOSE. It is per-TARGET state, and this hook shares one observer across all of them:
// honouring it would mean either disconnecting everybody on the first target's hit, or tracking a per-element
// settled set — which is `useInView` per item, i.e. the thing this hook exists to avoid. A consumer wanting
// once-per-row semantics keeps that bookkeeping in its own state, where the row identity already lives.
//
// SAME NO-DEPS-EFFECT + SEPARATE-CLEANUP SHAPE AS `UseInView`, and for the same reason: a `RefObject` mutating
// does not re-render, so the target set has to be re-read after every render rather than keyed on a dep array.
// Note the array of refs is read but never depended on — a caller passing a fresh array literal every render
// (the normal thing) costs a set diff, not a rebuild.

import { useCallback, useEffect, useRef, type RefObject } from 'react';

import {
  intersectionSignature,
  supportsIntersectionObserver,
  toIntersectionInit,
  type IntersectionOptions,
} from './ObserveIntersection';

/** Root/margin/threshold plus the one lifecycle knob that makes sense for a shared observer. */
export interface UseIntersectionObserverOptions extends IntersectionOptions {
  /** Suspend observation of every target without unmounting. Flipping it back re-observes them all. */
  readonly disabled?: boolean;
}

/**
 * Observes many elements through a single `IntersectionObserver`.
 *
 * The callback fires once per entry, and `entry.target` identifies which element it belongs to — the usual
 * consumer keeps a `Map` from element to row id, or compares against its own refs.
 *
 * The callback is read from a ref, so it never needs to be memoized: passing a fresh arrow every render is fine
 * and will not rebuild the observer.
 *
 * @param refs One ref per target. The array may be a new literal each render; nulls are skipped.
 * @param callback Receives each entry plus the shared observer.
 * @param options Root, margin, threshold, `disabled`.
 */
export function useIntersectionObserver(
  refs: readonly RefObject<Element | null>[],
  callback: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void,
  options?: UseIntersectionObserverOptions,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedRef = useRef<Set<Element>>(new Set());
  const signatureRef = useRef<string | null>(null);
  const rootRef = useRef<Element | Document | null>(null);

  const signature = intersectionSignature(options);
  const root = options?.root ?? null;
  const disabled = options?.disabled ?? false;

  /** Drops the observer and forgets every target. Refs are stable, so this closure is too. */
  const teardown = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    observedRef.current.clear();
  }, []);

  // No dependency array — runs after every render and diffs the target set; see the header.
  useEffect(() => {
    // Observer init is immutable once constructed, so an options change is the one thing that forces a rebuild.
    if (signature !== signatureRef.current || root !== rootRef.current) {
      teardown();
      signatureRef.current = signature;
      rootRef.current = root;
    }

    const next = new Set<Element>();
    if (!disabled) {
      for (const item of refs) {
        const element = item.current;
        if (element) next.add(element);
      }
    }

    if (next.size === 0) {
      teardown();
      return;
    }
    if (!supportsIntersectionObserver()) return;

    const observer =
      observerRef.current ??
      new IntersectionObserver((entries, self) => {
        for (const entry of entries) callbackRef.current(entry, self);
      }, toIntersectionInit(optionsRef.current));
    observerRef.current = observer;

    const observed = observedRef.current;
    // Snapshot before mutating — deleting from a Set mid-iteration is legal but reads as a trap.
    for (const element of [...observed]) {
      if (!next.has(element)) {
        observer.unobserve(element);
        observed.delete(element);
      }
    }
    for (const element of next) {
      if (!observed.has(element)) {
        observer.observe(element);
        observed.add(element);
      }
    }
  });

  useEffect(() => teardown, [teardown]);
}
