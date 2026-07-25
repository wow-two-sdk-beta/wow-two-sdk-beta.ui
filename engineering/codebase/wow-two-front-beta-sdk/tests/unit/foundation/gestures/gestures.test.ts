import { describe, expect, it } from 'vitest';

import {
  GestureAxis,
  SwipeDirection,
  acceptsPointerType,
  clampLongPressDelay,
  constrainToAxis,
  exceedsThreshold,
  gestureVelocity,
  normalizeAngle,
  pinchRotation,
  pinchScale,
  pointerAngle,
  pointerCenter,
  pointerDistance,
  swipeDirection,
  windowedVelocity,
  withinTolerance,
  type GestureSample,
} from '@src/foundation/gestures';
import { PressExtensions } from '@src/foundation/utils';

// Unit project (node) — the whole recognition arithmetic, with no DOM anywhere in reach.
//
// This is where the gestures slice is actually tested. A synthesized pointer stream can prove that a listener
// fired; it is a terrible instrument for proving that a 45° diagonal resolves the way the docs claim, that a
// rotation across the ±180° seam reports 20° and not 340°, or that a release whose final two events share
// coordinates still reports the flick that preceded it. Those are table-shaped questions, so they get tables.
//
// The long-press bounds are asserted against `PressExtensions.longPressDelay` itself rather than against literal
// numbers: the point of `clampLongPressDelay` is that this slice defers to the shared constant, and hardcoding
// `500` here would let the two drift apart without a single test turning red.

describe('gestureVelocity', () => {
  it('reports signed px/ms', () => {
    expect(gestureVelocity(100, 50)).toBe(2);
    expect(gestureVelocity(-100, 50)).toBe(-2);
  });

  it('returns 0 rather than Infinity when the clock did not tick', () => {
    // Two pointer events can genuinely share a timestamp; a gesture must not claim infinite speed because of it.
    expect(gestureVelocity(100, 0)).toBe(0);
    expect(gestureVelocity(100, -5)).toBe(0);
    expect(gestureVelocity(100, Number.NaN)).toBe(0);
  });

  it('treats a non-finite delta as no movement', () => {
    expect(gestureVelocity(Number.NaN, 50)).toBe(0);
    expect(gestureVelocity(Number.POSITIVE_INFINITY, 50)).toBe(0);
  });
});

describe('windowedVelocity', () => {
  /** Builds a chronological sample list from `[x, y, t]` triples. */
  function samples(...entries: readonly (readonly [number, number, number])[]): GestureSample[] {
    return entries.map(([x, y, t]) => ({ x, y, t }));
  }

  it('returns zero when there is nothing to measure', () => {
    expect(windowedVelocity([], 80)).toEqual({ velocityX: 0, velocityY: 0 });
    expect(windowedVelocity(samples([0, 0, 0]), 80)).toEqual({ velocityX: 0, velocityY: 0 });
  });

  it('measures from the oldest sample still inside the window', () => {
    const history = samples([0, 0, 0], [10, 0, 50], [30, 0, 100]);
    // Window 80 reaches back to t=50, not to t=0: (30-10) / (100-50) = 0.4 px/ms.
    expect(windowedVelocity(history, 80).velocityX).toBeCloseTo(0.4, 10);
  });

  it('reports the flick, not the slow drag that preceded it', () => {
    // A long, slow drag, then a fast throw at the end. Whole-gesture velocity would be 100/1000 = 0.1 px/ms and
    // the flick would be missed entirely.
    const history = samples([0, 0, 0], [20, 0, 900], [100, 0, 950]);
    expect(windowedVelocity(history, 80).velocityX).toBeCloseTo(1.6, 10);
    expect(gestureVelocity(100, 950)).toBeLessThan(0.2); // what the naive whole-gesture reading would have said
  });

  it('survives a pointerup that repeats the last move coordinates', () => {
    // The real shape of a release: `pointerup` arrives a few ms later at the same point. Measuring into that
    // stationary tail reports zero — the single most common way a swipe recognizer silently stops working.
    const history = samples([0, 0, 0], [100, 0, 100], [100, 0, 108]);
    expect(windowedVelocity(history, 80).velocityX).toBeCloseTo(1, 10);
  });

  it('reports zero when the pointer stopped well before releasing', () => {
    // Flick, then HOLD for 300ms, then release. Trimming the stationary tail unconditionally would resurrect the
    // pre-hold speed and fire a swipe the user had already talked themselves out of.
    const history = samples([0, 0, 0], [100, 0, 100], [100, 0, 400], [100, 0, 410]);
    expect(windowedVelocity(history, 80)).toEqual({ velocityX: 0, velocityY: 0 });
  });

  it('reports zero for a press that never moved at all', () => {
    expect(windowedVelocity(samples([5, 5, 0], [5, 5, 40], [5, 5, 90]), 80)).toEqual({
      velocityX: 0,
      velocityY: 0,
    });
  });

  it('falls back to the previous sample when everything has aged out of the window', () => {
    const history = samples([0, 0, 0], [10, 0, 500], [30, 0, 1000]);
    // Nothing but the last entry is within 80ms, so the immediately-preceding sample is used: 20 / 500.
    expect(windowedVelocity(history, 80).velocityX).toBeCloseTo(0.04, 10);
  });

  it('measures both axes independently', () => {
    const velocity = windowedVelocity(samples([0, 0, 0], [30, -60, 30]), 80);
    expect(velocity.velocityX).toBeCloseTo(1, 10);
    expect(velocity.velocityY).toBeCloseTo(-2, 10);
  });
});

describe('swipeDirection', () => {
  it.each([
    { dx: -100, dy: 0, expected: SwipeDirection.Left },
    { dx: 100, dy: 0, expected: SwipeDirection.Right },
    { dx: 0, dy: -100, expected: SwipeDirection.Up },
    { dx: 0, dy: 100, expected: SwipeDirection.Down },
    { dx: -100, dy: 30, expected: SwipeDirection.Left }, // dominant axis wins over the minor one
    { dx: 30, dy: 100, expected: SwipeDirection.Down },
  ])('resolves ($dx, $dy) to $expected', ({ dx, dy, expected }) => {
    expect(swipeDirection(dx, dy)).toBe(expected);
  });

  it.each([
    { dx: 50, dy: 50, expected: SwipeDirection.Right },
    { dx: -50, dy: 50, expected: SwipeDirection.Left },
    { dx: 50, dy: -50, expected: SwipeDirection.Right },
    { dx: -50, dy: -50, expected: SwipeDirection.Left },
  ])('breaks the exact diagonal ($dx, $dy) toward the horizontal axis', ({ dx, dy, expected }) => {
    // Documented, deterministic tie-break — the alternative is an answer that depends on comparison order.
    expect(swipeDirection(dx, dy)).toBe(expected);
  });

  it('reports no direction when the pointer did not move', () => {
    expect(swipeDirection(0, 0)).toBeNull();
    expect(swipeDirection(Number.NaN, Number.NaN)).toBeNull();
  });
});

describe('pointer geometry', () => {
  it('measures straight-line distance', () => {
    expect(pointerDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(pointerDistance({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(0);
  });

  it('measures angle clockwise from the positive x-axis, because y grows downward', () => {
    expect(pointerAngle({ x: 0, y: 0 }, { x: 100, y: 0 })).toBe(0);
    expect(pointerAngle({ x: 0, y: 0 }, { x: 0, y: 100 })).toBeCloseTo(90, 10); // down the screen
    expect(pointerAngle({ x: 0, y: 0 }, { x: 0, y: -100 })).toBeCloseTo(-90, 10); // up the screen
    expect(pointerAngle({ x: 0, y: 0 }, { x: -100, y: 0 })).toBeCloseTo(180, 10);
  });

  it('finds the midpoint', () => {
    expect(pointerCenter({ x: 0, y: 0 }, { x: 100, y: 40 })).toEqual({ x: 50, y: 20 });
    expect(pointerCenter({ x: -20, y: 10 }, { x: 20, y: -10 })).toEqual({ x: 0, y: 0 });
  });

  it('returns finite answers for non-finite coordinates', () => {
    expect(pointerDistance({ x: Number.NaN, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(Number.isFinite(pointerAngle({ x: 0, y: Number.NaN }, { x: 1, y: 1 }))).toBe(true);
  });
});

describe('pinchScale', () => {
  it('reports separation relative to the pinch origin', () => {
    expect(pinchScale(100, 200)).toBe(2);
    expect(pinchScale(100, 50)).toBe(0.5);
    expect(pinchScale(100, 100)).toBe(1);
  });

  it('returns 1 for a degenerate baseline instead of Infinity', () => {
    // Two pointers landing on the same pixel define nothing to scale against; a consumer must not be handed
    // Infinity to write into a transform.
    expect(pinchScale(0, 200)).toBe(1);
    expect(pinchScale(-5, 200)).toBe(1);
    expect(pinchScale(Number.NaN, 200)).toBe(1);
  });
});

describe('pinchRotation / normalizeAngle', () => {
  it('takes the short way round the ±180° seam', () => {
    // The whole reason this is not a subtraction: 170° → -170° is a 20° turn, not -340°.
    expect(pinchRotation(170, -170)).toBeCloseTo(20, 10);
    expect(pinchRotation(-170, 170)).toBeCloseTo(-20, 10);
  });

  it('reports ordinary rotations unchanged', () => {
    expect(pinchRotation(0, 90)).toBe(90);
    expect(pinchRotation(45, 0)).toBe(-45);
    expect(pinchRotation(0, 0)).toBe(0);
  });

  it.each([
    { input: 0, expected: 0 },
    { input: 90, expected: 90 },
    { input: 180, expected: -180 }, // the documented edge: 180 normalizes to the low end of the range
    { input: -180, expected: -180 },
    { input: 190, expected: -170 },
    { input: -190, expected: 170 },
    { input: 540, expected: -180 },
    { input: -720, expected: 0 },
  ])('normalizes $input° to $expected°', ({ input, expected }) => {
    expect(normalizeAngle(input)).toBeCloseTo(expected, 10);
  });

  it('normalizes a non-finite angle to zero', () => {
    expect(normalizeAngle(Number.NaN)).toBe(0);
  });
});

describe('constrainToAxis', () => {
  it('zeroes the component a locked gesture must not report', () => {
    expect(constrainToAxis(30, -40, GestureAxis.X)).toEqual({ dx: 30, dy: 0 });
    expect(constrainToAxis(30, -40, GestureAxis.Y)).toEqual({ dx: 0, dy: -40 });
    expect(constrainToAxis(30, -40, GestureAxis.Both)).toEqual({ dx: 30, dy: -40 });
  });

  it('sanitizes non-finite deltas', () => {
    expect(constrainToAxis(Number.NaN, Number.POSITIVE_INFINITY, GestureAxis.Both)).toEqual({ dx: 0, dy: 0 });
  });
});

describe('exceedsThreshold', () => {
  it('measures straight-line distance when unconstrained', () => {
    expect(exceedsThreshold(3, 4, 5, GestureAxis.Both)).toBe(true); // exactly at the threshold counts
    expect(exceedsThreshold(3, 4, 5.1, GestureAxis.Both)).toBe(false);
  });

  it('measures only its own axis when constrained', () => {
    // The gate that stops a vertical scroll from starting a horizontal drag.
    expect(exceedsThreshold(0, 100, 10, GestureAxis.X)).toBe(false);
    expect(exceedsThreshold(100, 0, 10, GestureAxis.Y)).toBe(false);
    expect(exceedsThreshold(-20, 0, 10, GestureAxis.X)).toBe(true); // sign-independent
    expect(exceedsThreshold(0, -20, 10, GestureAxis.Y)).toBe(true);
  });

  it('always passes at a zero threshold — the documented "recognize on contact" setting', () => {
    expect(exceedsThreshold(0, 0, 0, GestureAxis.Both)).toBe(true);
    expect(exceedsThreshold(0, 0, 0, GestureAxis.X)).toBe(true);
  });

  it('treats a negative or non-finite threshold as zero', () => {
    expect(exceedsThreshold(0, 0, -10, GestureAxis.Both)).toBe(true);
    expect(exceedsThreshold(0, 0, Number.NaN, GestureAxis.Both)).toBe(true);
  });
});

describe('withinTolerance', () => {
  it('is straight-line, because a hold has no direction', () => {
    expect(withinTolerance(3, 4, 5)).toBe(true);
    expect(withinTolerance(3, 4, 4.9)).toBe(false);
    expect(withinTolerance(0, 0, 0)).toBe(true);
  });

  it('absorbs tremor on either axis alike', () => {
    expect(withinTolerance(-6, 0, 10)).toBe(true);
    expect(withinTolerance(0, -6, 10)).toBe(true);
    expect(withinTolerance(-11, 0, 10)).toBe(false);
  });
});

describe('acceptsPointerType', () => {
  it('accepts every device when no allowlist is given', () => {
    expect(acceptsPointerType('mouse', undefined)).toBe(true);
    expect(acceptsPointerType('', undefined)).toBe(true);
  });

  it('applies an allowlist literally', () => {
    expect(acceptsPointerType('touch', ['touch', 'pen'])).toBe(true);
    expect(acceptsPointerType('mouse', ['touch', 'pen'])).toBe(false);
  });

  it('reads an empty allowlist as "nothing", not as "everything"', () => {
    // An allowlist that arrived empty from a caller's own filtering should visibly disable the gesture rather
    // than quietly widening it to every device.
    expect(acceptsPointerType('mouse', [])).toBe(false);
    expect(acceptsPointerType('touch', [])).toBe(false);
  });
});

describe('clampLongPressDelay', () => {
  const { min, max, default: fallback } = PressExtensions.longPressDelay;

  it('falls back to the SHARED default, not a local constant', () => {
    expect(clampLongPressDelay(undefined)).toBe(fallback);
    expect(clampLongPressDelay(Number.NaN)).toBe(fallback);
  });

  it('clamps into the shared bounds', () => {
    expect(clampLongPressDelay(min - 1)).toBe(min);
    expect(clampLongPressDelay(0)).toBe(min);
    expect(clampLongPressDelay(max + 1)).toBe(max);
    expect(clampLongPressDelay(Number.POSITIVE_INFINITY)).toBe(fallback); // non-finite, so the default applies
  });

  it('passes an in-range delay through untouched', () => {
    expect(clampLongPressDelay(min)).toBe(min);
    expect(clampLongPressDelay(max)).toBe(max);
    expect(clampLongPressDelay(1_000)).toBe(1_000);
  });
});
