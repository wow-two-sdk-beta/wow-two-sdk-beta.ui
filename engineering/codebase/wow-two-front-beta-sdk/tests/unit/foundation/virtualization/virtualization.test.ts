import { describe, expect, it } from 'vitest';

import {
  DEFAULT_OVERSCAN,
  EMPTY_MEASUREMENTS,
  EMPTY_RANGE,
  buildMeasurements,
  computeRange,
  computeScrollOffset,
  findIndexAtOffset,
  findIndexByOffsetAccessor,
  itemOffset,
  itemSize,
  measurementsTotalSize,
  withMeasuredSize,
  type Measurements,
} from '@src/foundation/virtualization';

// Node project — the windowing math is pure arithmetic, so all of it is provable here without a layout engine.
// The browser file covers only the scroll/resize plumbing.
//
// Two properties carry most of the weight:
//
//  1. The binary search agrees with a brute-force linear scan over a seeded random size array. The search is the
//     one piece whose whole purpose is to be faster than the obvious implementation, so it is checked against
//     the obvious implementation at every offset rather than at a handful of hand-picked ones.
//  2. The fixed-size arithmetic path and the variable-size search path return IDENTICAL ranges for a uniform
//     list. They are two code paths answering one question; a divergence would surface only as a one-row
//     flicker at particular scroll positions, which is exactly the kind of bug a test has to catch.
//
// Sizes are kept integral so every sum is exact and assertions can use `toBe` rather than a float epsilon.

/** Deterministic PRNG (mulberry32) — a seeded size array is reproducible, so a failure is always replayable. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integral sizes in `[min, max]`, reproducible for a given seed. */
function randomSizes(count: number, seed: number, min = 10, max = 90): number[] {
  const next = mulberry32(seed);
  return Array.from({ length: count }, () => min + Math.floor(next() * (max - min + 1)));
}

/** The O(n) definition the O(log n) search must match: the LAST index whose start edge is `<= target`. */
function bruteForceIndexAt(measurements: Measurements, target: number): number {
  if (measurements.count <= 0) return -1;
  let best = 0;
  for (let index = 0; index < measurements.count; index += 1) {
    if (itemOffset(measurements, index) <= target) best = index;
  }
  return best;
}

/** Offsets accessor over a measurements object — the shape `computeRange` takes for the variable-size path. */
function offsetsOf(measurements: Measurements): (index: number) => number {
  return (index) => itemOffset(measurements, index);
}

/** `paddingStart + rendered + paddingEnd === totalSize` — the invariant that keeps the scrollbar honest. */
function expectPaddingInvariant(measurements: Measurements, range: ReturnType<typeof computeRange>): void {
  const rendered =
    range.endIndex < range.startIndex
      ? 0
      : itemOffset(measurements, range.endIndex + 1) - itemOffset(measurements, range.startIndex);
  expect(range.paddingStart + rendered + range.paddingEnd).toBe(measurementsTotalSize(measurements));
}

const UNIFORM = 50;
const UNIFORM_COUNT = 100;
const uniformMeasurements = buildMeasurements(UNIFORM_COUNT, () => UNIFORM);

describe('buildMeasurements', () => {
  it('builds cumulative offsets with a tail entry holding the total size', () => {
    const measurements = buildMeasurements(4, (index) => (index + 1) * 10);

    expect(measurements.count).toBe(4);
    expect(measurements.offsets).toEqual([0, 10, 30, 60, 100]);
    expect(measurementsTotalSize(measurements)).toBe(100);
  });

  it('returns the shared empty value for a zero, negative, or non-finite count', () => {
    expect(buildMeasurements(0, () => 10)).toBe(EMPTY_MEASUREMENTS);
    expect(buildMeasurements(-5, () => 10)).toBe(EMPTY_MEASUREMENTS);
    expect(buildMeasurements(Number.NaN, () => 10)).toBe(EMPTY_MEASUREMENTS);
    expect(measurementsTotalSize(EMPTY_MEASUREMENTS)).toBe(0);
  });

  it('floors negative and non-finite sizes to 0 so offsets stay non-decreasing', () => {
    const measurements = buildMeasurements(4, (index) => (index === 1 ? -40 : index === 2 ? Number.NaN : 20));

    expect(measurements.offsets).toEqual([0, 20, 20, 20, 40]);
    for (let index = 1; index <= measurements.count; index += 1) {
      expect(itemOffset(measurements, index)).toBeGreaterThanOrEqual(itemOffset(measurements, index - 1));
    }
  });

  it('derives item sizes from adjacent offsets and clamps out-of-range reads', () => {
    const measurements = buildMeasurements(3, () => 25);

    expect(itemSize(measurements, 0)).toBe(25);
    expect(itemSize(measurements, 2)).toBe(25);
    expect(itemSize(measurements, 3)).toBe(0); // past the end
    expect(itemSize(measurements, -1)).toBe(0);
    expect(itemOffset(measurements, 99)).toBe(75); // clamps to the tail entry
    expect(itemOffset(measurements, -99)).toBe(0);
  });
});

describe('findIndexByOffsetAccessor / findIndexAtOffset', () => {
  it('locates the item occupying an offset, inclusive of its start edge', () => {
    expect(findIndexAtOffset(uniformMeasurements, 0)).toBe(0);
    expect(findIndexAtOffset(uniformMeasurements, 49)).toBe(0);
    expect(findIndexAtOffset(uniformMeasurements, 50)).toBe(1); // exactly on item 1's start edge
    expect(findIndexAtOffset(uniformMeasurements, 51)).toBe(1);
    expect(findIndexAtOffset(uniformMeasurements, 4999)).toBe(99);
  });

  it('clamps a negative offset to the first item and an over-long one to the last', () => {
    expect(findIndexAtOffset(uniformMeasurements, -1000)).toBe(0);
    expect(findIndexAtOffset(uniformMeasurements, Number.NaN)).toBe(0);
    expect(findIndexAtOffset(uniformMeasurements, 999_999)).toBe(99);
  });

  it('reports -1 for an empty list', () => {
    expect(findIndexAtOffset(EMPTY_MEASUREMENTS, 0)).toBe(-1);
    expect(findIndexByOffsetAccessor(() => 0, 0, 100)).toBe(-1);
  });

  it('resolves a run of zero-size items to the last index sharing the offset', () => {
    // Items 1..3 are zero-sized, so items 1, 2, 3 AND 4 all start at 20. The item genuinely occupying pixel 20
    // is item 4 (it spans 20..40) — the search must step past the whole collapsed run to reach it.
    const measurements = buildMeasurements(5, (index) => (index === 0 || index === 4 ? 20 : 0));

    expect(measurements.offsets).toEqual([0, 20, 20, 20, 20, 40]);
    expect(findIndexAtOffset(measurements, 19)).toBe(0);
    expect(findIndexAtOffset(measurements, 20)).toBe(4);
    expect(findIndexAtOffset(measurements, 39)).toBe(4);
  });

  it('resolves a trailing zero-size run to its last item', () => {
    // Nothing follows the run, so the last zero-size item is the answer.
    const measurements = buildMeasurements(3, (index) => (index === 0 ? 20 : 0));

    expect(measurements.offsets).toEqual([0, 20, 20, 20]);
    expect(findIndexAtOffset(measurements, 20)).toBe(2);
  });

  it('matches a brute-force linear scan at every offset across a seeded random size array', () => {
    const sizes = randomSizes(200, 0xc0ffee);
    const measurements = buildMeasurements(sizes.length, (index) => sizes[index] ?? 0);
    const total = measurementsTotalSize(measurements);

    // Every integer pixel in the list, plus a margin past both ends.
    for (let offset = -20; offset <= total + 20; offset += 1) {
      expect(findIndexAtOffset(measurements, offset)).toBe(bruteForceIndexAt(measurements, offset));
    }
  });

  it('matches brute force across several independent seeds', () => {
    for (const seed of [1, 7, 42, 1337, 90_210]) {
      const sizes = randomSizes(97, seed);
      const measurements = buildMeasurements(sizes.length, (index) => sizes[index] ?? 0);

      for (let index = 0; index < measurements.count; index += 1) {
        const start = itemOffset(measurements, index);
        const end = itemOffset(measurements, index + 1);
        // Both edges of every item, and a point inside it.
        for (const probe of [start, start + 1, Math.floor((start + end) / 2), end - 1]) {
          expect(findIndexAtOffset(measurements, probe)).toBe(bruteForceIndexAt(measurements, probe));
        }
      }
    }
  });
});

describe('withMeasuredSize', () => {
  it('shifts every later offset by the difference and leaves earlier ones alone', () => {
    const measurements = buildMeasurements(4, () => 20);
    const updated = withMeasuredSize(measurements, 1, 50);

    expect(updated.offsets).toEqual([0, 20, 70, 90, 110]);
    expect(itemSize(updated, 1)).toBe(50);
    expect(measurementsTotalSize(updated)).toBe(110);
    expect(measurements.offsets).toEqual([0, 20, 40, 60, 80]); // original untouched
  });

  it('returns the SAME object when nothing changed — the identity that breaks the measure loop', () => {
    const measurements = buildMeasurements(4, () => 20);

    expect(withMeasuredSize(measurements, 1, 20)).toBe(measurements);
    expect(withMeasuredSize(measurements, -1, 999)).toBe(measurements);
    expect(withMeasuredSize(measurements, 4, 999)).toBe(measurements);
  });

  it('handles a shrink and floors a negative measurement to 0', () => {
    const measurements = buildMeasurements(3, () => 30);

    expect(withMeasuredSize(measurements, 0, 10).offsets).toEqual([0, 10, 40, 70]);
    expect(withMeasuredSize(measurements, 0, -10).offsets).toEqual([0, 0, 30, 60]);
  });
});

describe('computeRange — fixed size', () => {
  const fixed = (scrollOffset: number, viewportSize = 200, overscan = 0) =>
    computeRange({ scrollOffset, viewportSize, itemCount: UNIFORM_COUNT, estimateSize: UNIFORM, overscan });

  it('windows the viewport at the top of the list', () => {
    // Viewport 0..200 over 50px items → items 0..3; item 4 starts exactly at 200 and is NOT visible.
    expect(fixed(0)).toEqual({ startIndex: 0, endIndex: 3, paddingStart: 0, paddingEnd: 4800 });
  });

  it('windows a mid-list offset, including the partially visible item at each edge', () => {
    // Viewport 125..325 → item 2 (100..150) is partly visible at the top, item 6 (300..350) at the bottom.
    expect(fixed(125)).toEqual({ startIndex: 2, endIndex: 6, paddingStart: 100, paddingEnd: 4650 });
  });

  it('excludes an item whose start edge sits exactly on the bottom edge', () => {
    // Viewport 100..300: item 6 starts at exactly 300 and must be excluded.
    expect(fixed(100)).toEqual({ startIndex: 2, endIndex: 5, paddingStart: 100, paddingEnd: 4700 });
  });

  it('windows the tail of the list', () => {
    // maxScroll = 5000 - 200 = 4800 → items 96..99.
    expect(fixed(4800)).toEqual({ startIndex: 96, endIndex: 99, paddingStart: 4800, paddingEnd: 0 });
  });

  it('holds the padding invariant at every scroll offset', () => {
    for (let offset = 0; offset <= 5000; offset += 37) {
      expectPaddingInvariant(uniformMeasurements, fixed(offset, 200, DEFAULT_OVERSCAN));
    }
  });
});

describe('computeRange — overscan', () => {
  const withOverscan = (scrollOffset: number, overscan: number) =>
    computeRange({ scrollOffset, viewportSize: 200, itemCount: UNIFORM_COUNT, estimateSize: UNIFORM, overscan });

  it('expands the window symmetrically in the middle of the list', () => {
    const bare = withOverscan(2000, 0);
    const padded = withOverscan(2000, 3);

    expect(bare.startIndex).toBe(40);
    expect(bare.endIndex).toBe(43);
    expect(padded.startIndex).toBe(37);
    expect(padded.endIndex).toBe(46);
  });

  it('clamps the expansion at the start of the list', () => {
    const range = withOverscan(0, 10);

    expect(range.startIndex).toBe(0); // cannot go below 0
    expect(range.endIndex).toBe(13);
    expect(range.paddingStart).toBe(0);
  });

  it('clamps the expansion at the end of the list', () => {
    const range = withOverscan(4800, 10);

    expect(range.startIndex).toBe(86);
    expect(range.endIndex).toBe(99); // cannot exceed itemCount - 1
    expect(range.paddingEnd).toBe(0);
  });

  it('renders the whole list when overscan exceeds it, and still balances the padding', () => {
    const range = withOverscan(2000, 1000);

    expect(range).toEqual({ startIndex: 0, endIndex: 99, paddingStart: 0, paddingEnd: 0 });
    expectPaddingInvariant(uniformMeasurements, range);
  });

  it('treats a negative or non-finite overscan as 0', () => {
    expect(withOverscan(2000, -5)).toEqual(withOverscan(2000, 0));
    expect(withOverscan(2000, Number.NaN)).toEqual(withOverscan(2000, 0));
  });
});

describe('computeRange — variable size', () => {
  const sizes = [100, 20, 80, 40, 60, 30, 90, 10, 70, 50]; // total 550
  const measurements = buildMeasurements(sizes.length, (index) => sizes[index] ?? 0);

  const variable = (scrollOffset: number, viewportSize = 200, overscan = 0) =>
    computeRange({
      scrollOffset,
      viewportSize,
      itemCount: measurements.count,
      overscan,
      getOffset: offsetsOf(measurements),
    });

  it('walks the cumulative offsets rather than assuming a uniform size', () => {
    expect(measurements.offsets).toEqual([0, 100, 120, 200, 240, 300, 330, 420, 430, 500, 550]);

    // Viewport 0..200: items 0 (0..100), 1 (100..120), 2 (120..200). Item 3 starts exactly at 200 → excluded.
    expect(variable(0)).toEqual({ startIndex: 0, endIndex: 2, paddingStart: 0, paddingEnd: 350 });
  });

  it('windows a mid-list offset over uneven items', () => {
    // Viewport 130..330: item 2 (120..200) straddles the top; item 5 (300..330) is the last to start before 330.
    expect(variable(130)).toEqual({ startIndex: 2, endIndex: 5, paddingStart: 120, paddingEnd: 220 });
  });

  it('clamps an offset past the end to the last window', () => {
    // maxScroll = 550 - 200 = 350 → viewport 350..550 → items 6..9.
    expect(variable(10_000)).toEqual({ startIndex: 6, endIndex: 9, paddingStart: 330, paddingEnd: 0 });
  });

  it('holds the padding invariant at every offset and overscan', () => {
    for (let offset = -50; offset <= 600; offset += 7) {
      for (const overscan of [0, 1, 3, 25]) {
        expectPaddingInvariant(measurements, variable(offset, 200, overscan));
      }
    }
  });

  it('agrees with the fixed-size path for a uniform list at every scroll offset', () => {
    for (let offset = 0; offset <= 5200; offset += 13) {
      for (const overscan of [0, DEFAULT_OVERSCAN, 12]) {
        const shared = { scrollOffset: offset, viewportSize: 200, itemCount: UNIFORM_COUNT, overscan };
        expect(computeRange({ ...shared, getOffset: offsetsOf(uniformMeasurements) })).toEqual(
          computeRange({ ...shared, estimateSize: UNIFORM }),
        );
      }
    }
  });

  it('agrees with the fixed-size path across viewport sizes, including sub-item ones', () => {
    for (const viewportSize of [0, 1, 49, 50, 51, 200, 999, 100_000]) {
      for (let offset = 0; offset <= 5000; offset += 211) {
        const shared = { scrollOffset: offset, viewportSize, itemCount: UNIFORM_COUNT, overscan: 2 };
        expect(computeRange({ ...shared, getOffset: offsetsOf(uniformMeasurements) })).toEqual(
          computeRange({ ...shared, estimateSize: UNIFORM }),
        );
      }
    }
  });

  it('accepts a per-index estimator as the O(n) fallback and matches the getOffset path', () => {
    const shared = { scrollOffset: 130, viewportSize: 200, itemCount: sizes.length, overscan: 1 };

    expect(computeRange({ ...shared, estimateSize: (index: number) => sizes[index] ?? 0 })).toEqual(
      computeRange({ ...shared, getOffset: offsetsOf(measurements) }),
    );
  });
});

describe('computeRange — guards', () => {
  it('renders nothing for an empty list', () => {
    expect(computeRange({ scrollOffset: 0, viewportSize: 200, itemCount: 0, estimateSize: UNIFORM })).toBe(
      EMPTY_RANGE,
    );
    expect(EMPTY_RANGE.endIndex).toBeLessThan(EMPTY_RANGE.startIndex); // the emptiness test consumers rely on
  });

  it('renders nothing for a negative or non-finite item count', () => {
    const base = { scrollOffset: 0, viewportSize: 200, estimateSize: UNIFORM };

    expect(computeRange({ ...base, itemCount: -3 })).toBe(EMPTY_RANGE);
    expect(computeRange({ ...base, itemCount: Number.NaN })).toBe(EMPTY_RANGE);
  });

  it('renders the entire list when the viewport is larger than the content', () => {
    const range = computeRange({ scrollOffset: 0, viewportSize: 10_000, itemCount: 10, estimateSize: UNIFORM });

    expect(range).toEqual({ startIndex: 0, endIndex: 9, paddingStart: 0, paddingEnd: 0 });
  });

  it('clamps a negative scroll offset (rubber-band overscroll) to the top window', () => {
    const base = { viewportSize: 200, itemCount: UNIFORM_COUNT, estimateSize: UNIFORM, overscan: 2 };

    expect(computeRange({ ...base, scrollOffset: -500 })).toEqual(computeRange({ ...base, scrollOffset: 0 }));
  });

  it('clamps a scroll offset past the end to the bottom window', () => {
    const base = { viewportSize: 200, itemCount: UNIFORM_COUNT, estimateSize: UNIFORM, overscan: 2 };

    // maxScroll = 5000 - 200 = 4800.
    expect(computeRange({ ...base, scrollOffset: 999_999 })).toEqual(
      computeRange({ ...base, scrollOffset: 4800 }),
    );
  });

  it('substitutes 0 for a non-finite scroll offset or viewport size rather than producing NaN', () => {
    const nanOffset = computeRange({
      scrollOffset: Number.NaN,
      viewportSize: 200,
      itemCount: 10,
      estimateSize: UNIFORM,
    });
    const nanViewport = computeRange({
      scrollOffset: 100,
      viewportSize: Number.NaN,
      itemCount: 10,
      estimateSize: UNIFORM,
    });

    expect(nanOffset.startIndex).toBe(0);
    expect(Number.isFinite(nanOffset.paddingEnd)).toBe(true);
    expect(Number.isFinite(nanViewport.paddingStart)).toBe(true);
    expect(Number.isFinite(nanViewport.paddingEnd)).toBe(true);
  });

  it('renders a single item for a zero-height viewport instead of an empty window', () => {
    // Nothing is visible, but rendering one row is what lets a not-yet-measured container measure something.
    const range = computeRange({ scrollOffset: 0, viewportSize: 0, itemCount: 10, estimateSize: UNIFORM });

    expect(range.startIndex).toBe(0);
    expect(range.endIndex).toBe(0);
  });

  it('survives a list whose items are all zero-sized', () => {
    const zeroed = buildMeasurements(10, () => 0);
    const range = computeRange({
      scrollOffset: 0,
      viewportSize: 200,
      itemCount: 10,
      overscan: 2,
      getOffset: offsetsOf(zeroed),
    });

    expect(measurementsTotalSize(zeroed)).toBe(0);
    expect(Number.isFinite(range.paddingStart)).toBe(true);
    expectPaddingInvariant(zeroed, range);
  });

  it('never reports a negative padding', () => {
    for (const scrollOffset of [-1000, 0, 137, 4800, 99_999]) {
      for (const viewportSize of [0, 50, 200, 99_999]) {
        const range = computeRange({
          scrollOffset,
          viewportSize,
          itemCount: UNIFORM_COUNT,
          estimateSize: UNIFORM,
          overscan: DEFAULT_OVERSCAN,
        });

        expect(range.paddingStart).toBeGreaterThanOrEqual(0);
        expect(range.paddingEnd).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('computeScrollOffset', () => {
  // 100 items x 50px = 5000 total; viewport 200 → maxScroll 4800.
  const base = { viewportSize: 200, itemCount: UNIFORM_COUNT, estimateSize: UNIFORM };

  it('aligns to start, end, and center', () => {
    expect(computeScrollOffset({ ...base, scrollOffset: 0, index: 40, align: 'start' })).toBe(2000);
    expect(computeScrollOffset({ ...base, scrollOffset: 0, index: 40, align: 'end' })).toBe(1850);
    expect(computeScrollOffset({ ...base, scrollOffset: 0, index: 40, align: 'center' })).toBe(1925);
  });

  it('clamps every alignment into the scrollable range', () => {
    expect(computeScrollOffset({ ...base, scrollOffset: 0, index: 0, align: 'center' })).toBe(0);
    expect(computeScrollOffset({ ...base, scrollOffset: 0, index: 99, align: 'start' })).toBe(4800);
    expect(computeScrollOffset({ ...base, scrollOffset: 0, index: 99, align: 'center' })).toBe(4800);
  });

  it('auto: does nothing when the item is already fully visible', () => {
    // Viewport 2000..2200 holds items 40..43 whole.
    for (const index of [40, 41, 42, 43]) {
      expect(computeScrollOffset({ ...base, scrollOffset: 2000, index, align: 'auto' })).toBe(2000);
    }
  });

  it('auto: scrolls up to the item start when it is above the viewport', () => {
    expect(computeScrollOffset({ ...base, scrollOffset: 2000, index: 10, align: 'auto' })).toBe(500);
  });

  it('auto: scrolls down just enough to reveal an item below the viewport', () => {
    // Item 50 spans 2500..2550; aligning its bottom edge to the viewport's bottom → 2350.
    expect(computeScrollOffset({ ...base, scrollOffset: 2000, index: 50, align: 'auto' })).toBe(2350);
  });

  it('auto: moves a partially visible item fully into view', () => {
    // Viewport 2025..2225 — item 44 (2200..2250) is cut off at the bottom.
    expect(computeScrollOffset({ ...base, scrollOffset: 2025, index: 44, align: 'auto' })).toBe(2050);
  });

  it('auto: defaults to auto when no alignment is given', () => {
    expect(computeScrollOffset({ ...base, scrollOffset: 2000, index: 41 })).toBe(2000);
  });

  it('auto: pins the top of an item taller than the viewport, but holds still while it fills the view', () => {
    const tall = buildMeasurements(5, (index) => (index === 2 ? 900 : 50));
    const oversized = {
      viewportSize: 200,
      itemCount: tall.count,
      getOffset: offsetsOf(tall),
      index: 2,
      align: 'auto' as const,
    };

    // Item 2 spans 100..1000. From the top it is only partly visible → pin its top edge.
    expect(computeScrollOffset({ ...oversized, scrollOffset: 0 })).toBe(100);
    // From inside the item it already fills the viewport → do not move.
    expect(computeScrollOffset({ ...oversized, scrollOffset: 500 })).toBe(500);
  });

  it('walks cumulative offsets for a variable-size list', () => {
    const sizes = [100, 20, 80, 40, 60, 30, 90, 10, 70, 50];
    const measurements = buildMeasurements(sizes.length, (index) => sizes[index] ?? 0);
    const variable = { viewportSize: 200, itemCount: measurements.count, getOffset: offsetsOf(measurements) };

    expect(computeScrollOffset({ ...variable, scrollOffset: 0, index: 6, align: 'start' })).toBe(330);
    expect(computeScrollOffset({ ...variable, scrollOffset: 0, index: 6, align: 'end' })).toBe(220);
  });

  it('clamps an out-of-range index instead of producing NaN', () => {
    expect(computeScrollOffset({ ...base, scrollOffset: 0, index: 9999, align: 'start' })).toBe(4800);
    expect(computeScrollOffset({ ...base, scrollOffset: 0, index: -50, align: 'start' })).toBe(0);
    expect(computeScrollOffset({ ...base, scrollOffset: 0, index: Number.NaN, align: 'start' })).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(computeScrollOffset({ ...base, itemCount: 0, scrollOffset: 0, index: 5, align: 'start' })).toBe(0);
  });

  it('returns 0 when the content is shorter than the viewport', () => {
    const short = { viewportSize: 10_000, itemCount: 10, estimateSize: UNIFORM };

    for (const align of ['start', 'center', 'end', 'auto'] as const) {
      expect(computeScrollOffset({ ...short, scrollOffset: 0, index: 9, align })).toBe(0);
    }
  });
});
