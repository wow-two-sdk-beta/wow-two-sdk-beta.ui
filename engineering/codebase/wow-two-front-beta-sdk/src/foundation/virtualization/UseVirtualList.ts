// The React binding for the windowing math: watch a scroll container, and hand back only the items that need to
// exist in the DOM. Headless — it renders nothing and dictates no markup; it returns numbers.
//
// WHAT THE HOOK ACTUALLY OWNS: three pieces of state (scroll offset, viewport size, a measurement version) and
// the effects that keep them true. Everything geometric is delegated to `Windowing`/`Measurements`, which stay
// pure and node-testable. If a change is about "which items", it belongs there, not here.
//
// SCROLL ANCHORING — the hard part, and the reason this hook is more than 40 lines:
//
//   When an item ABOVE the fold turns out to be taller than its estimate, every pixel below it shifts down by
//   the difference. The user is looking at those pixels, so the list visibly jumps under them — the classic
//   "content leaps while you're reading" bug in every hand-rolled virtual list. The fix is to add the same
//   delta to the scroll position, which cancels the shift exactly: same content, same pixels.
//
//   Two details make it actually work:
//
//   1. WHEN to compensate. Only when the re-measured item ends AT OR ABOVE the viewport's top edge. If it
//      merely straddles that edge, its own top is pinned above the fold and does not move, so the content the
//      user is reading is already stable — compensating there would CAUSE the jump instead of preventing it.
//      Below the fold, nothing visible moves at all.
//
//   2. WHEN to apply it. Not inside `measureItem`: at that moment the container is still its old height, so
//      assigning a larger `scrollTop` gets silently clamped by the browser and the correction is lost. It is
//      staged as an accumulated delta and applied in a LAYOUT EFFECT — after React commits the taller spacer,
//      before the browser paints. The applied value is then read back from the DOM, because the browser is the
//      authority on how far the container can actually scroll.
//
//   Deltas accumulate rather than overwrite: several items commonly re-measure in one flush, and each must
//   contribute.
//
// LOOP SAFETY: `measureItem` is a no-op when the size is unchanged. That single guard is what keeps a consumer
// wiring it to a ResizeObserver from spinning measure -> render -> measure forever.
//
// STABLE CALLBACKS: `scrollToIndex` and `measureItem` never change identity, so they are safe in effect deps
// and in refs. Every mutable input they need is ref-read — the same idiom as `foundation/shortcuts`' hotkeys.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { useResizeObserver } from '../hooks';
import {
  buildMeasurements,
  itemOffset,
  itemSize,
  measurementsTotalSize,
  type Measurements,
} from './Measurements';
import {
  DEFAULT_OVERSCAN,
  computeRange,
  computeScrollOffset,
  type ScrollAlignment,
  type VirtualRange,
} from './Windowing';

/** One rendered row: where to put it and how big it is. */
export interface VirtualItem {
  /** Index into the consumer's data array. */
  readonly index: number;

  /** Offset of the item's start edge from the list's start, in pixels — the value to position it at. */
  readonly start: number;

  /** The item's current size in pixels: its real measurement if one was recorded, otherwise the estimate. */
  readonly size: number;

  /** Stable React key — `getItemKey(index)` when supplied, otherwise the index itself. */
  readonly key: string | number;
}

/** Configures a `useVirtualList` binding. */
export interface UseVirtualListOptions {
  /** How many items the full list has. */
  readonly count: number;

  /**
   * Estimated size of the item at an index, in pixels, used until a real measurement arrives. Read from a ref,
   * so an inline arrow is fine — but a CHANGED estimator only takes effect when `count` changes or an item is
   * re-measured.
   */
  readonly estimateSize: (index: number) => number;

  /** Ref to the scrolling container. The `foundation/shortcuts` idiom — a ref that may still be null on first render. */
  readonly target?: RefObject<HTMLElement | null>;

  /** Callback form of the same thing, for containers not held in a ref. Takes precedence over `target`. */
  readonly getScrollElement?: () => HTMLElement | null;

  /** Extra items rendered beyond each edge of the viewport. Defaults to {@link DEFAULT_OVERSCAN}. */
  readonly overscan?: number;

  /** Whether the list scrolls horizontally (`scrollLeft`/`clientWidth`) instead of vertically. Defaults to `false`. */
  readonly horizontal?: boolean;

  /** Viewport size assumed before the container is measured — set it to render a sensible first frame under SSR. Defaults to `0`. */
  readonly initialViewportSize?: number;

  /** Stable key for an item, for reordering data. Defaults to the index. */
  readonly getItemKey?: (index: number) => string | number;
}

/** What a virtualized list hands back to its consumer. */
export interface VirtualList {
  /** The items to render right now, in index order, overscan included. Empty when the list is empty. */
  readonly virtualItems: readonly VirtualItem[];

  /** Combined size of every item — the size the scrollable spacer must have for the scrollbar to be honest. */
  readonly totalSize: number;

  /** The underlying window: rendered index bounds plus leading/trailing spacer sizes, for padding-based layouts. */
  readonly range: VirtualRange;

  /** Pixels of content skipped before the first rendered item. Same as `range.paddingStart`. */
  readonly paddingStart: number;

  /** Pixels of content skipped after the last rendered item. Same as `range.paddingEnd`. */
  readonly paddingEnd: number;

  /** The container's current scroll position along the list's axis, as the hook last observed it. */
  readonly scrollOffset: number;

  /** The container's measured viewport size along the list's axis. `0` until the container mounts. */
  readonly viewportSize: number;

  /**
   * Scrolls the container so item `index` is in view. Identity-stable.
   *
   * @param index Item to reveal; clamped into range.
   * @param align Where it should land. Defaults to `'auto'` — a no-op when the item is already fully visible.
   */
  scrollToIndex(index: number, align?: ScrollAlignment): void;

  /**
   * Records an item's real measured size, replacing its estimate. Identity-stable and a no-op when the size is
   * unchanged, so it is safe to call from a ResizeObserver or a layout effect on every commit.
   *
   * Preserves the visible content when the item sits above the fold — see this file's header.
   *
   * @param index The item that was measured.
   * @param size Its real size in pixels.
   */
  measureItem(index: number, size: number): void;
}

/**
 * Virtualizes a list: subscribes to a scroll container and reports only the items overlapping its viewport.
 *
 * Headless by design — it produces geometry, never markup. The consumer renders a spacer sized `totalSize` and
 * positions each `virtualItem` at its `start`. See the `foundation/virtualization` barrel for a usage sketch.
 *
 * SSR-safe: with no container it reports the window implied by `initialViewportSize` and never touches the DOM.
 *
 * @param options The item count, size estimator, and the container to watch.
 * @returns The current window, total size, and the `scrollToIndex` / `measureItem` controls.
 */
export function useVirtualList(options: UseVirtualListOptions): VirtualList {
  const { count, overscan = DEFAULT_OVERSCAN, horizontal = false } = options;

  // Ref-read the whole bag so a consumer never has to memoize `estimateSize` / `getItemKey` / `getScrollElement`.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const horizontalRef = useRef(horizontal);
  horizontalRef.current = horizontal;

  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewportSize, setViewportSize] = useState(() => Math.max(0, options.initialViewportSize ?? 0));
  const [measurementVersion, setMeasurementVersion] = useState(0);

  const scrollElementRef = useRef<HTMLElement | null>(null);
  scrollElementRef.current = scrollElement;

  const scrollOffsetRef = useRef(scrollOffset);
  scrollOffsetRef.current = scrollOffset;

  /** Real sizes reported through `measureItem`, keyed by index; absent entries fall back to the estimate. */
  const measuredSizesRef = useRef<Map<number, number>>(new Map());

  /** Scroll correction owed to items that grew/shrank above the fold, applied after the next commit. */
  const pendingScrollDeltaRef = useRef(0);

  // The container can be swapped, unmounted, or conditionally rendered long after this hook mounts, and a
  // `getScrollElement` callback can start returning a different node at any time — neither shows up in a
  // dependency list. Re-resolving on EVERY commit and bailing out on identity is the cheapest way to notice.
  // No update chain: an equal value makes `setState` bail before re-rendering, so this settles in one pass.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const resolved =
      optionsRef.current.getScrollElement?.() ?? optionsRef.current.target?.current ?? null;
    setScrollElement((previous) => (previous === resolved ? previous : resolved));
  });

  const measurements = useMemo<Measurements>(
    () =>
      buildMeasurements(count, (index) => {
        const measured = measuredSizesRef.current.get(index);
        return measured ?? optionsRef.current.estimateSize(index);
      }),
    // `measurementVersion` is the content key for the measured-size map, which lives in a ref and therefore
    // cannot be a dependency itself. `estimateSize` is ref-read on purpose: an inline arrow would otherwise
    // rebuild every offset on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, measurementVersion],
  );

  const measurementsRef = useRef(measurements);
  measurementsRef.current = measurements;

  const totalSize = measurementsTotalSize(measurements);

  // Track the container's scroll position. `passive` because this listener never calls `preventDefault`, so the
  // browser may keep scrolling on its own thread.
  useEffect(() => {
    if (!scrollElement) return;

    const sync = (): void => {
      const next = horizontal ? scrollElement.scrollLeft : scrollElement.scrollTop;
      setScrollOffset((previous) => (previous === next ? previous : next));
    };

    // Adopt the position the container already has — a restored scroll or a deep link would otherwise render
    // the top of the list until the user's first scroll.
    sync();
    scrollElement.addEventListener('scroll', sync, { passive: true });
    return () => scrollElement.removeEventListener('scroll', sync);
  }, [scrollElement, horizontal]);

  // A FRESH ref object per element: `useResizeObserver` reads `ref.current` once at attach and re-runs only when
  // `[ref, enabled]` change, so a new identity is what makes it re-observe a swapped-in container.
  const observedRef = useMemo<RefObject<HTMLElement | null>>(
    () => ({ current: scrollElement }),
    [scrollElement],
  );

  const readViewportSize = useCallback((): void => {
    const element = scrollElementRef.current;
    if (!element) return;
    // `clientHeight`/`clientWidth`, not the observer's `contentRect`: the scrollable viewport includes padding
    // and excludes the scrollbar, which is exactly what these report and `contentRect` does not.
    const next = horizontal ? element.clientWidth : element.clientHeight;
    setViewportSize((previous) => (previous === next ? previous : next));
  }, [horizontal]);

  useResizeObserver(observedRef, readViewportSize, scrollElement !== null);

  // Seed the size before the first paint. The observer also fires on attach, but that lands a frame later — long
  // enough to paint one frame of an unwindowed (or empty) list.
  useLayoutEffect(() => {
    readViewportSize();
  }, [scrollElement, readViewportSize]);

  // Apply the anchoring correction owed from the last `measureItem` batch. Runs AFTER the commit that resized
  // the spacer, so the container can actually reach the new offset, and BEFORE paint, so nothing jumps.
  useLayoutEffect(() => {
    const delta = pendingScrollDeltaRef.current;
    if (delta === 0) return;
    pendingScrollDeltaRef.current = 0;

    const element = scrollElementRef.current;
    if (!element) return;

    const currentPosition = horizontal ? element.scrollLeft : element.scrollTop;
    const target = Math.max(0, currentPosition + delta);
    if (horizontal) element.scrollLeft = target;
    else element.scrollTop = target;

    // Read back rather than trusting the arithmetic — the browser clamps to the container's real scroll range.
    const applied = horizontal ? element.scrollLeft : element.scrollTop;
    setScrollOffset((previous) => (previous === applied ? previous : applied));
  }, [measurementVersion, horizontal]);

  const range = useMemo<VirtualRange>(
    () =>
      computeRange({
        scrollOffset,
        viewportSize,
        itemCount: count,
        overscan,
        // Always the variable-size path: measured sizes can make any list non-uniform at any time, and the
        // binary search over the prefix sum is O(log n) either way.
        getOffset: (index) => itemOffset(measurements, index),
      }),
    [scrollOffset, viewportSize, count, overscan, measurements],
  );

  const virtualItems = useMemo<readonly VirtualItem[]>(() => {
    if (range.endIndex < range.startIndex) return [];

    const { getItemKey } = optionsRef.current;
    const items: VirtualItem[] = [];
    for (let index = range.startIndex; index <= range.endIndex; index += 1) {
      items.push({
        index,
        start: itemOffset(measurements, index),
        size: itemSize(measurements, index),
        key: getItemKey ? getItemKey(index) : index,
      });
    }
    return items;
  }, [range, measurements]);

  const measureItem = useCallback((index: number, size: number): void => {
    if (!Number.isFinite(size) || size < 0) return;

    const current = measurementsRef.current;
    if (index < 0 || index >= current.count) return;

    const previous = itemSize(current, index);
    // The guard that stops a measure -> render -> measure loop dead. Everything below re-renders.
    if (previous === size) return;

    measuredSizesRef.current.set(index, size);

    // Compensate only for an item entirely above the viewport's top edge — see this file's header for why a
    // straddling item must NOT be compensated. Accumulate: a whole batch of items can re-measure in one flush.
    const endsAboveFold = itemOffset(current, index) + previous <= scrollOffsetRef.current;
    if (endsAboveFold) pendingScrollDeltaRef.current += size - previous;

    setMeasurementVersion((version) => version + 1);
  }, []);

  const scrollToIndex = useCallback((index: number, align: ScrollAlignment = 'auto'): void => {
    const element = scrollElementRef.current;
    if (!element) return;

    const isHorizontal = horizontalRef.current;
    const current = measurementsRef.current;
    // Read position and size live off the DOM: `scrollToIndex` is often called right after a mutation, before
    // the hook's state has caught up, and the stale value would land the item in the wrong place.
    const next = computeScrollOffset({
      index,
      align,
      scrollOffset: isHorizontal ? element.scrollLeft : element.scrollTop,
      viewportSize: isHorizontal ? element.clientWidth : element.clientHeight,
      itemCount: current.count,
      getOffset: (target) => itemOffset(current, target),
    });

    if (isHorizontal) element.scrollLeft = next;
    else element.scrollTop = next;

    const applied = isHorizontal ? element.scrollLeft : element.scrollTop;
    setScrollOffset((previous) => (previous === applied ? previous : applied));
  }, []);

  return {
    virtualItems,
    totalSize,
    range,
    paddingStart: range.paddingStart,
    paddingEnd: range.paddingEnd,
    scrollOffset,
    viewportSize,
    scrollToIndex,
    measureItem,
  };
}
