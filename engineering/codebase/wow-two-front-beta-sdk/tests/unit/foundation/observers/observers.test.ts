import { describe, expect, it } from 'vitest';

import { visibilityThresholds } from '@src/foundation/observers';

// Unit project (node — no DOM). Only the slice's pure arithmetic lives here: the threshold ladder `useVisibility`
// samples with. Everything that needs a real `IntersectionObserver` / `MutationObserver` is in
// `observers.browser.test.ts`.
//
// The ladder is worth its own tests because two of its properties are load-bearing and neither is obvious: it
// must always END at exactly 1 (a consumer waiting for "fully visible" never fires otherwise), and it must be
// free of float noise (`3/15` is `0.19999999999999998`, which would leak into the hooks' option signature and
// make two identical ladders compare unequal).

describe('visibilityThresholds', () => {
  it('divides 0–1 into `steps` intervals, inclusive at both ends', () => {
    expect(visibilityThresholds(4)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('returns `steps + 1` thresholds', () => {
    expect(visibilityThresholds(20)).toHaveLength(21);
    expect(visibilityThresholds(1)).toHaveLength(2);
  });

  it('always starts at 0 and ends at exactly 1', () => {
    for (const steps of [1, 3, 7, 20, 100]) {
      const ladder = visibilityThresholds(steps);
      expect(ladder.at(0)).toBe(0);
      expect(ladder.at(-1)).toBe(1); // exact — a `0.9999` last step never reports "fully visible"
    }
  });

  it('ascends strictly', () => {
    const ladder = visibilityThresholds(17);
    for (let index = 1; index < ladder.length; index += 1) {
      expect(ladder[index] ?? 0).toBeGreaterThan(ladder[index - 1] ?? 0);
    }
  });

  it('rounds away float noise from uneven divisions', () => {
    // Raw `3 / 15` is 0.19999999999999998 — the ladder must not carry that.
    expect(visibilityThresholds(15)).toContain(0.2);
    for (const value of visibilityThresholds(15)) {
      expect(String(value).replace('0.', '').length).toBeLessThanOrEqual(4);
    }
  });

  it('clamps to at least 1 step rather than emitting an empty or infinite ladder', () => {
    expect(visibilityThresholds(0)).toEqual([0, 1]);
    expect(visibilityThresholds(-5)).toEqual([0, 1]);
  });

  it('caps the ladder so a consumer cannot ask for thousands of callbacks per scroll', () => {
    expect(visibilityThresholds(10_000)).toHaveLength(101); // 100 steps
  });

  it('rounds a fractional step count instead of producing fractional intervals', () => {
    expect(visibilityThresholds(3.4)).toEqual(visibilityThresholds(3));
    expect(visibilityThresholds(3.6)).toEqual(visibilityThresholds(4));
  });

  it('degrades a non-finite step count to the minimum instead of throwing', () => {
    expect(visibilityThresholds(Number.NaN)).toEqual([0, 1]);
    expect(visibilityThresholds(Number.POSITIVE_INFINITY)).toEqual([0, 1]);
  });

  it('returns a frozen ladder, so a consumer cannot mutate a shared observer config', () => {
    expect(Object.isFrozen(visibilityThresholds(4))).toBe(true);
  });
});
