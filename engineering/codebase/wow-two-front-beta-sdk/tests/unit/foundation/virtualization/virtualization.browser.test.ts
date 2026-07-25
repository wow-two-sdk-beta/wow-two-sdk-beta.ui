import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useVirtualList } from '@src/foundation/virtualization';

// Browser project (real chromium ⇒ a real layout engine, real `scrollTop`, a real ResizeObserver). This file
// covers ONLY what needs a browser: that the hook adopts a container's measured size and scroll position, that a
// scroll event moves the window, that `scrollToIndex` drives the real `scrollTop`, and that `measureItem`
// preserves the visible anchor. The windowing arithmetic itself is proven in `virtualization.test.ts`.
//
// WHY THE SPACER IS OVERSIZED: the hook is headless, so nothing renders the `totalSize` spacer that would
// normally give the container its scroll range — `renderHook` renders no list at all. A deliberately huge inner
// div stands in for it, so `scrollTop` assignments are never clamped by the browser and the anchoring
// arithmetic is what is actually under test. In a real consumer the spacer IS `totalSize`, which is exactly why
// the barrel documents that contract.
//
// Scroll events are dispatched explicitly inside `act`: the browser's own scroll event is asynchronous, and
// waiting a frame for it would make these tests timing-dependent for no gain. (The late native event carries the
// same value, so its `setState` bails out and never escapes `act`.)

const ITEM_SIZE = 30;
const COUNT = 1000;
const VIEWPORT = 300;
const OVERSCAN = 3;

const containers: HTMLDivElement[] = [];

/** A real scrollable container with an oversized spacer. Tracked for teardown. */
function scroller(horizontal = false): HTMLDivElement {
  const element = document.createElement('div');
  element.style.cssText = horizontal
    ? `position:absolute;top:0;left:0;width:${VIEWPORT}px;height:100px;overflow-x:auto;overflow-y:hidden;padding:0;border:0;box-sizing:border-box;`
    : `position:absolute;top:0;left:0;width:200px;height:${VIEWPORT}px;overflow-y:auto;overflow-x:hidden;padding:0;border:0;box-sizing:border-box;`;

  const spacer = document.createElement('div');
  spacer.style.cssText = horizontal ? 'width:500000px;height:1px;' : 'height:500000px;width:1px;';
  element.appendChild(spacer);

  document.body.appendChild(element);
  containers.push(element);
  return element;
}

/** Dispatches a real scroll event on the container, flushed through `act`. */
function emitScroll(element: HTMLElement): void {
  act(() => {
    element.dispatchEvent(new Event('scroll', { bubbles: false }));
  });
}

/** Scrolls the container and notifies the hook in one step. */
function scrollTo(element: HTMLElement, offset: number, horizontal = false): void {
  if (horizontal) element.scrollLeft = offset;
  else element.scrollTop = offset;
  emitScroll(element);
}

/** Renders the hook against `element` with the suite's standard fixed-size list. */
function renderList(element: HTMLElement, horizontal = false) {
  return renderHook(() =>
    useVirtualList({
      count: COUNT,
      estimateSize: () => ITEM_SIZE,
      target: { current: element },
      overscan: OVERSCAN,
      horizontal,
    }),
  );
}

afterEach(() => {
  cleanup();
  for (const element of containers.splice(0)) element.remove();
});

describe('useVirtualList — mounting', () => {
  it('measures the container and windows the list on first render', () => {
    const element = scroller();
    const { result } = renderList(element);

    expect(result.current.viewportSize).toBe(VIEWPORT);
    expect(result.current.totalSize).toBe(COUNT * ITEM_SIZE);
    // Items 0..9 fill 0..300 (item 10 starts exactly on the bottom edge), plus 3 items of trailing overscan.
    expect(result.current.range).toEqual({
      startIndex: 0,
      endIndex: 12,
      paddingStart: 0,
      paddingEnd: (COUNT - 13) * ITEM_SIZE,
    });
    expect(result.current.virtualItems.map((item) => item.index)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it('positions and sizes every virtual item', () => {
    const element = scroller();
    const { result } = renderList(element);

    for (const item of result.current.virtualItems) {
      expect(item.start).toBe(item.index * ITEM_SIZE);
      expect(item.size).toBe(ITEM_SIZE);
      expect(item.key).toBe(item.index);
    }
  });

  it('adopts a scroll position the container already had', () => {
    const element = scroller();
    element.scrollTop = 900; // a restored scroll / deep link, set before the hook ever mounts

    const { result } = renderList(element);

    expect(result.current.scrollOffset).toBe(900);
    expect(result.current.range.startIndex).toBe(30 - OVERSCAN);
  });

  it('reports an empty window with no container and never touches the DOM', () => {
    const { result } = renderHook(() =>
      useVirtualList({ count: COUNT, estimateSize: () => ITEM_SIZE, target: { current: null } }),
    );

    expect(result.current.viewportSize).toBe(0);
    expect(result.current.totalSize).toBe(COUNT * ITEM_SIZE);
    expect(result.current.virtualItems.map((item) => item.index)).toEqual([0, 1, 2, 3]);
  });

  it('applies a custom item key', () => {
    const element = scroller();
    const { result } = renderHook(() =>
      useVirtualList({
        count: COUNT,
        estimateSize: () => ITEM_SIZE,
        target: { current: element },
        getItemKey: (index) => `row-${index}`,
      }),
    );

    expect(result.current.virtualItems.at(0)?.key).toBe('row-0');
  });
});

describe('useVirtualList — scrolling', () => {
  it('moves the window when the container scrolls', () => {
    const element = scroller();
    const { result } = renderList(element);

    scrollTo(element, 600);

    expect(result.current.scrollOffset).toBe(600);
    // Viewport 600..900 → items 20..29, widened by 3 on each side.
    expect(result.current.range.startIndex).toBe(17);
    expect(result.current.range.endIndex).toBe(32);
    expect(result.current.virtualItems.at(0)?.start).toBe(17 * ITEM_SIZE);
  });

  it('tracks several successive scrolls', () => {
    const element = scroller();
    const { result } = renderList(element);

    for (const offset of [0, 150, 3000, 90, 29_700]) {
      scrollTo(element, offset);
      expect(result.current.scrollOffset).toBe(offset);
      expect(result.current.range.startIndex).toBe(Math.max(0, Math.floor(offset / ITEM_SIZE) - OVERSCAN));
    }
  });

  it('windows the tail when scrolled to the very end', () => {
    const element = scroller();
    const { result } = renderList(element);

    scrollTo(element, COUNT * ITEM_SIZE - VIEWPORT); // 29700

    expect(result.current.range.endIndex).toBe(COUNT - 1);
    expect(result.current.paddingEnd).toBe(0);
  });

  it('reads scrollLeft and clientWidth in horizontal mode', () => {
    const element = scroller(true);
    const { result } = renderList(element, true);

    expect(result.current.viewportSize).toBe(VIEWPORT);

    scrollTo(element, 600, true);

    expect(result.current.scrollOffset).toBe(600);
    expect(result.current.range.startIndex).toBe(17);
  });

  it('stops tracking after unmount', () => {
    const element = scroller();
    const { result, unmount } = renderList(element);
    const before = result.current.range.startIndex;

    unmount();
    scrollTo(element, 6000);

    expect(result.current.range.startIndex).toBe(before);
  });
});

describe('useVirtualList — scrollToIndex', () => {
  it('drives the real scrollTop for each alignment', () => {
    const element = scroller();
    const { result } = renderList(element);

    act(() => result.current.scrollToIndex(500, 'start'));
    expect(element.scrollTop).toBe(500 * ITEM_SIZE);
    expect(result.current.scrollOffset).toBe(500 * ITEM_SIZE);

    act(() => result.current.scrollToIndex(500, 'end'));
    expect(element.scrollTop).toBe(501 * ITEM_SIZE - VIEWPORT);

    act(() => result.current.scrollToIndex(500, 'center'));
    expect(element.scrollTop).toBe(500 * ITEM_SIZE + ITEM_SIZE / 2 - VIEWPORT / 2);
  });

  it('brings the target into the rendered window', () => {
    const element = scroller();
    const { result } = renderList(element);

    act(() => result.current.scrollToIndex(742, 'start'));

    expect(result.current.virtualItems.map((item) => item.index)).toContain(742);
  });

  it('auto: holds still for an already-visible item', () => {
    const element = scroller();
    const { result } = renderList(element);
    scrollTo(element, 600);

    act(() => result.current.scrollToIndex(22, 'auto')); // 660..690, inside 600..900

    expect(element.scrollTop).toBe(600);
  });

  it('auto: scrolls the shortest distance to reveal an off-screen item', () => {
    const element = scroller();
    const { result } = renderList(element);
    scrollTo(element, 600);

    act(() => result.current.scrollToIndex(40, 'auto')); // 1200..1230, below the fold
    expect(element.scrollTop).toBe(1230 - VIEWPORT);

    act(() => result.current.scrollToIndex(4, 'auto')); // 120..150, above the fold
    expect(element.scrollTop).toBe(120);
  });

  it('is a no-op with no container', () => {
    const { result } = renderHook(() =>
      useVirtualList({ count: COUNT, estimateSize: () => ITEM_SIZE, target: { current: null } }),
    );

    expect(() => act(() => result.current.scrollToIndex(10, 'start'))).not.toThrow();
  });
});

describe('useVirtualList — measureItem', () => {
  it('replaces an estimate with the real size and grows the total', () => {
    const element = scroller();
    const { result } = renderList(element);

    act(() => result.current.measureItem(2, 100));

    expect(result.current.totalSize).toBe(COUNT * ITEM_SIZE + 70);
    expect(result.current.virtualItems.at(2)?.size).toBe(100);
    // Item 3 shifts down by the difference; items before item 2 do not move.
    expect(result.current.virtualItems.at(1)?.start).toBe(ITEM_SIZE);
    expect(result.current.virtualItems.at(3)?.start).toBe(2 * ITEM_SIZE + 100);
  });

  it('keeps the visible anchor stable when an item above the fold grows', () => {
    const element = scroller();
    const { result } = renderList(element);
    scrollTo(element, 600); // item 20's top edge is exactly at the viewport top

    const anchorBefore = result.current.virtualItems.find((item) => item.index === 20);
    expect(anchorBefore?.start).toBe(600);

    // Item 5 spans 150..180 — entirely above the fold. Growing it by 100 would push item 20 to 700.
    act(() => result.current.measureItem(5, ITEM_SIZE + 100));

    expect(element.scrollTop).toBe(700); // scroll compensated by exactly the delta
    expect(result.current.scrollOffset).toBe(700);
    const anchorAfter = result.current.virtualItems.find((item) => item.index === 20);
    expect(anchorAfter?.start).toBe(element.scrollTop); // same item, same pixel — no visible jump
  });

  it('keeps the anchor stable when an item above the fold shrinks', () => {
    const element = scroller();
    const { result } = renderList(element);
    scrollTo(element, 600);

    act(() => result.current.measureItem(5, ITEM_SIZE - 20));

    expect(element.scrollTop).toBe(580);
    expect(result.current.virtualItems.find((item) => item.index === 20)?.start).toBe(580);
  });

  it('accumulates a whole batch of above-the-fold measurements', () => {
    const element = scroller();
    const { result } = renderList(element);
    scrollTo(element, 600);

    // Three items re-measure in one flush — every delta must contribute, not just the last.
    act(() => {
      result.current.measureItem(1, ITEM_SIZE + 10);
      result.current.measureItem(2, ITEM_SIZE + 20);
      result.current.measureItem(3, ITEM_SIZE + 30);
    });

    expect(element.scrollTop).toBe(660);
    expect(result.current.virtualItems.find((item) => item.index === 20)?.start).toBe(660);
  });

  it('does not compensate for an item below the fold', () => {
    const element = scroller();
    const { result } = renderList(element);
    scrollTo(element, 600);

    act(() => result.current.measureItem(25, ITEM_SIZE + 100)); // 750..780, inside the viewport

    expect(element.scrollTop).toBe(600);
    expect(result.current.virtualItems.find((item) => item.index === 20)?.start).toBe(600);
  });

  it('does not compensate for the item straddling the top edge', () => {
    const element = scroller();
    const { result } = renderList(element);
    scrollTo(element, 610); // item 20 spans 600..630 and straddles the fold

    // Its top is pinned above the fold and does not move, so the visible content is already stable.
    act(() => result.current.measureItem(20, ITEM_SIZE + 100));

    expect(element.scrollTop).toBe(610);
    expect(result.current.virtualItems.find((item) => item.index === 20)?.start).toBe(600);
  });

  it('is a no-op for an unchanged size or an out-of-range index', () => {
    const element = scroller();
    const { result } = renderList(element);
    scrollTo(element, 600);
    const itemsBefore = result.current.virtualItems;

    act(() => {
      result.current.measureItem(5, ITEM_SIZE); // same size
      result.current.measureItem(-1, 500);
      result.current.measureItem(COUNT, 500);
    });

    expect(element.scrollTop).toBe(600);
    expect(result.current.totalSize).toBe(COUNT * ITEM_SIZE);
    expect(result.current.virtualItems).toBe(itemsBefore); // identity held — nothing recomputed
  });

  it('survives a measurement with no container attached', () => {
    const { result } = renderHook(() =>
      useVirtualList({ count: COUNT, estimateSize: () => ITEM_SIZE, target: { current: null } }),
    );

    act(() => result.current.measureItem(0, 120));

    expect(result.current.totalSize).toBe(COUNT * ITEM_SIZE + 90);
  });

  it('keeps measured sizes across a scroll', () => {
    const element = scroller();
    const { result } = renderList(element);

    act(() => result.current.measureItem(40, 200));
    scrollTo(element, 1000);

    expect(result.current.virtualItems.find((item) => item.index === 40)?.size).toBe(200);
  });
});
