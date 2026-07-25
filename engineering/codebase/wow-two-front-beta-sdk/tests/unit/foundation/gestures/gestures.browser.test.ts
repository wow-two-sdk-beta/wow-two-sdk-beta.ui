import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useDrag,
  useLongPress,
  usePinch,
  useSwipe,
  type DragPayload,
  type LongPressPayload,
  type PinchPayload,
  type SwipePayload,
} from '@src/foundation/gestures';
import { PressExtensions } from '@src/foundation/utils';

// Browser project (real chromium, real DOM), following the `useHotkeys` idiom: a real element, real events
// dispatched inside `act` so the listener attached in an effect is guaranteed installed first.
//
// TWO THINGS THIS HARNESS HAS TO DO DIFFERENTLY FROM A KEYBOARD TEST:
//
//  - `timeStamp` IS PINNED PER EVENT. A synthesized `PointerEvent` takes its timestamp from the real clock at
//    construction, so a whole gesture built in one tick spans ~0ms and every velocity reads as zero or infinity.
//    `pointerEvent` overrides the property, which makes velocity — the thing `useSwipe` gates on — a controlled
//    input rather than a race against the test runner's speed.
//
//  - POINTER CAPTURE IS STUBBED WHERE IT IS ASSERTED. `setPointerCapture` requires a pointer id the browser knows
//    to be active; a synthesized id is not, so a real call throws `NotFoundError`. The hooks swallow that by
//    design (capture is an optimization — the window listeners are what actually deliver the events), so most
//    tests let it throw and pass regardless. The one test that asserts the capture CONTRACT replaces the three
//    methods with spies, which is the only way to observe request-and-release without a real input device.
//
// Moves and releases are dispatched on the element with `bubbles: true`; the hooks listen on `window`, so this is
// the same path a real gesture takes rather than a shortcut around it.

afterEach(cleanup);

/** Elements created by `mountTarget`, torn down after each test. */
const mounted: HTMLElement[] = [];

afterEach(() => {
  for (const element of mounted) element.remove();
  mounted.length = 0;
});

/** Creates a real, attached element and returns a stable ref object for it. */
function mountTarget(): { readonly element: HTMLElement; readonly ref: { current: HTMLElement | null } } {
  const element = document.createElement('div');
  document.body.appendChild(element);
  mounted.push(element);
  return { element, ref: { current: element } };
}

/** Options for one synthesized pointer event. */
interface PointerInit {
  readonly pointerId?: number;
  readonly x?: number;
  readonly y?: number;
  readonly t?: number;
  readonly pointerType?: string;
}

/**
 * Dispatches a real `PointerEvent` on `element` inside `act`, with `timeStamp` pinned when `t` is given.
 */
function fire(element: HTMLElement, type: string, init: PointerInit = {}): void {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: init.pointerId ?? 1,
    pointerType: init.pointerType ?? 'touch',
    clientX: init.x ?? 0,
    clientY: init.y ?? 0,
    isPrimary: true,
  });
  if (init.t !== undefined) Object.defineProperty(event, 'timeStamp', { value: init.t, configurable: true });
  act(() => {
    element.dispatchEvent(event);
  });
}

describe('useDrag', () => {
  /** Renders `useDrag` on a fresh element, collecting every payload it emits. */
  function setup(options?: Parameters<typeof useDrag>[2]) {
    const { element, ref } = mountTarget();
    const starts: DragPayload[] = [];
    const moves: DragPayload[] = [];
    const ends: DragPayload[] = [];
    const view = renderHook(() =>
      useDrag(
        ref,
        {
          onDragStart: (payload) => starts.push(payload),
          onDragMove: (payload) => moves.push(payload),
          onDragEnd: (payload) => ends.push(payload),
        },
        options,
      ),
    );
    return { element, starts, moves, ends, unmount: view.unmount };
  }

  it('does not recognize a drag below the threshold', () => {
    const { element, starts, ends } = setup({ threshold: 10 });

    fire(element, 'pointerdown', { x: 0, y: 0, t: 0 });
    fire(element, 'pointermove', { x: 5, y: 0, t: 20 });
    fire(element, 'pointerup', { x: 5, y: 0, t: 30 });

    // Below the threshold the interaction is still a press — this is what keeps a click alive on a draggable.
    expect(starts).toHaveLength(0);
    expect(ends).toHaveLength(0); // no start means no end, ever
  });

  it('runs a start / move / end sequence once the threshold is cleared', () => {
    const { element, starts, moves, ends } = setup({ threshold: 10 });

    fire(element, 'pointerdown', { x: 0, y: 0, t: 0 });
    fire(element, 'pointermove', { x: 20, y: 0, t: 50 });
    fire(element, 'pointermove', { x: 40, y: 0, t: 100 });
    fire(element, 'pointerup', { x: 40, y: 0, t: 110 });

    expect(starts).toHaveLength(1);
    expect(starts[0]?.dx).toBe(20);
    expect(moves).toHaveLength(1); // the move that STARTS a drag is not also reported as a move
    expect(moves[0]?.dx).toBe(40);
    expect(ends).toHaveLength(1);
    expect(ends[0]?.dx).toBe(40);
    expect(ends[0]?.elapsedMs).toBe(110);
    expect(ends[0]?.x).toBe(40);
  });

  it('recognizes on contact at a zero threshold', () => {
    const { element, starts } = setup({ threshold: 0 });

    fire(element, 'pointerdown', { x: 7, y: 9, t: 0 });

    expect(starts).toHaveLength(1);
    expect(starts[0]?.dx).toBe(0);
    expect(starts[0]?.x).toBe(7);
  });

  it('reports velocity from the recent window, not the whole drag', () => {
    const { element, ends } = setup({ threshold: 0 });

    // Slow for 900ms, then thrown. A whole-gesture reading would report ~0.1 px/ms and miss the flick.
    fire(element, 'pointerdown', { x: 0, y: 0, t: 0 });
    fire(element, 'pointermove', { x: 20, y: 0, t: 900 });
    fire(element, 'pointermove', { x: 100, y: 0, t: 950 });
    fire(element, 'pointerup', { x: 100, y: 0, t: 960 });

    expect(ends[0]?.velocityX).toBeCloseTo(1.6, 5);
  });

  it('locks to an axis for both recognition and the reported delta', () => {
    const { element, starts } = setup({ threshold: 10, axis: 'x' });

    fire(element, 'pointerdown', { x: 0, y: 0, t: 0 });
    fire(element, 'pointermove', { x: 0, y: 50, t: 20 });
    expect(starts).toHaveLength(0); // a vertical scroll must not start a horizontal drag

    fire(element, 'pointermove', { x: 20, y: 50, t: 40 });
    expect(starts).toHaveLength(1);
    expect(starts[0]?.dx).toBe(20);
    expect(starts[0]?.dy).toBe(0); // off-axis is zeroed, so a consumer can bind it straight to a transform
  });

  it('requests pointer capture on down and releases it on up', () => {
    const { element, ref } = mountTarget();
    // Stubbed: a synthesized pointer id is not an active pointer, so the real call throws `NotFoundError`.
    const setCapture = vi.fn();
    const releaseCapture = vi.fn();
    element.setPointerCapture = setCapture;
    element.releasePointerCapture = releaseCapture;
    element.hasPointerCapture = () => true;

    renderHook(() => useDrag(ref, {}, { threshold: 0 }));

    fire(element, 'pointerdown', { pointerId: 42, x: 0, y: 0, t: 0 });
    expect(setCapture).toHaveBeenCalledWith(42);

    fire(element, 'pointerup', { pointerId: 42, x: 10, y: 0, t: 20 });
    expect(releaseCapture).toHaveBeenCalledWith(42);
  });

  it('releases pointer capture when unmounted mid-drag', () => {
    const { element, ref } = mountTarget();
    const releaseCapture = vi.fn();
    element.setPointerCapture = vi.fn();
    element.releasePointerCapture = releaseCapture;
    element.hasPointerCapture = () => true;

    const { unmount } = renderHook(() => useDrag(ref, {}, { threshold: 0 }));
    fire(element, 'pointerdown', { pointerId: 7, x: 0, y: 0, t: 0 });

    unmount();

    expect(releaseCapture).toHaveBeenCalledWith(7);
  });

  it('ends the drag on pointercancel', () => {
    const { element, ends } = setup({ threshold: 0 });

    fire(element, 'pointerdown', { x: 0, y: 0, t: 0 });
    fire(element, 'pointercancel', { x: 30, y: 0, t: 40 });

    expect(ends).toHaveLength(1);
    expect(ends[0]?.event.type).toBe('pointercancel'); // how a consumer tells a cancellation from a completion
  });

  it('does nothing when disabled', () => {
    const { element, starts, ends } = setup({ threshold: 0, disabled: true });

    fire(element, 'pointerdown', { x: 0, y: 0, t: 0 });
    fire(element, 'pointermove', { x: 40, y: 0, t: 20 });
    fire(element, 'pointerup', { x: 40, y: 0, t: 30 });

    expect(starts).toHaveLength(0);
    expect(ends).toHaveLength(0);
  });

  it('filters by pointer type', () => {
    const { element, starts } = setup({ threshold: 0, pointerTypes: ['touch'] });

    fire(element, 'pointerdown', { pointerType: 'mouse', x: 0, y: 0, t: 0 });
    expect(starts).toHaveLength(0);

    fire(element, 'pointerdown', { pointerType: 'touch', x: 0, y: 0, t: 10 });
    expect(starts).toHaveLength(1);
  });

  it('ignores a second pointer — a drag is single-pointer by construction', () => {
    const { element, starts } = setup({ threshold: 0 });

    fire(element, 'pointerdown', { pointerId: 1, x: 0, y: 0, t: 0 });
    fire(element, 'pointerdown', { pointerId: 2, x: 50, y: 0, t: 10 });

    expect(starts).toHaveLength(1);
  });

  it('stops tracking when unmounted mid-drag', () => {
    const { element, starts, moves, ends, unmount } = setup({ threshold: 0 });

    fire(element, 'pointerdown', { x: 0, y: 0, t: 0 });
    expect(starts).toHaveLength(1);

    unmount();
    fire(element, 'pointermove', { x: 40, y: 0, t: 20 });
    fire(element, 'pointerup', { x: 40, y: 0, t: 30 });

    expect(moves).toHaveLength(0); // window listeners detached with the component
    expect(ends).toHaveLength(0);
  });
});

describe('useSwipe', () => {
  /** Renders `useSwipe` on a fresh element, collecting every recognized flick. */
  function setup(options?: Parameters<typeof useSwipe>[2]) {
    const { element, ref } = mountTarget();
    const swipes: SwipePayload[] = [];
    renderHook(() => useSwipe(ref, { onSwipe: (payload) => swipes.push(payload) }, options));
    return { element, swipes };
  }

  it('recognizes a rightward flick', () => {
    const { element, swipes } = setup();

    fire(element, 'pointerdown', { x: 0, y: 0, t: 0 });
    fire(element, 'pointermove', { x: 60, y: 0, t: 50 });
    fire(element, 'pointerup', { x: 60, y: 0, t: 60 });

    expect(swipes).toHaveLength(1);
    expect(swipes[0]?.direction).toBe('right');
    expect(swipes[0]?.distance).toBe(60);
    expect(swipes[0]?.velocity).toBeCloseTo(1.2, 5);
  });

  it('recognizes an upward flick', () => {
    const { element, swipes } = setup();

    fire(element, 'pointerdown', { x: 0, y: 100, t: 0 });
    fire(element, 'pointermove', { x: 0, y: 20, t: 50 });
    fire(element, 'pointerup', { x: 0, y: 20, t: 60 });

    expect(swipes[0]?.direction).toBe('up');
    expect(swipes[0]?.distance).toBe(80);
  });

  it('does not fire below the distance threshold, however fast', () => {
    const { element, swipes } = setup();

    fire(element, 'pointerdown', { x: 0, y: 0, t: 0 });
    fire(element, 'pointermove', { x: 20, y: 0, t: 10 }); // 2 px/ms — plenty fast, far too short
    fire(element, 'pointerup', { x: 20, y: 0, t: 20 });

    expect(swipes).toHaveLength(0);
  });

  it('does not fire below the velocity threshold, however far', () => {
    const { element, swipes } = setup();

    // A long, deliberate drag: 200px, but taken slowly and at rest before release. A distance-only recognizer
    // would advance the carousel the user was carefully positioning.
    fire(element, 'pointerdown', { x: 0, y: 0, t: 0 });
    fire(element, 'pointermove', { x: 200, y: 0, t: 800 });
    fire(element, 'pointerup', { x: 200, y: 0, t: 1000 });

    expect(swipes).toHaveLength(0);
  });

  it('honours a raised distance threshold', () => {
    const { element, swipes } = setup({ threshold: 100 });

    fire(element, 'pointerdown', { x: 0, y: 0, t: 0 });
    fire(element, 'pointermove', { x: 60, y: 0, t: 50 });
    fire(element, 'pointerup', { x: 60, y: 0, t: 60 });

    expect(swipes).toHaveLength(0);
  });

  it('reports nothing for a press that never moved', () => {
    const { element, swipes } = setup();

    fire(element, 'pointerdown', { x: 10, y: 10, t: 0 });
    fire(element, 'pointerup', { x: 10, y: 10, t: 20 });

    expect(swipes).toHaveLength(0);
  });

  it('suppresses off-axis flicks when locked to an axis', () => {
    const { element, swipes } = setup({ axis: 'x' });

    fire(element, 'pointerdown', { x: 0, y: 100, t: 0 });
    fire(element, 'pointermove', { x: 0, y: 20, t: 50 });
    fire(element, 'pointerup', { x: 0, y: 20, t: 60 });

    expect(swipes).toHaveLength(0);
  });
});

describe('useLongPress', () => {
  // Only the timer functions are faked: browser mode drives the runner on real time, and faking the clock
  // wholesale destabilizes it.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Renders `useLongPress` on a fresh element, collecting every completed hold. */
  function setup(options?: Parameters<typeof useLongPress>[2]) {
    const { element, ref } = mountTarget();
    const fired: LongPressPayload[] = [];
    const view = renderHook(() => useLongPress(ref, (payload) => fired.push(payload), options));
    return { element, fired, unmount: view.unmount };
  }

  /** Advances the faked timers inside `act`. */
  function advance(ms: number): void {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  it('fires after the shared default delay, not one millisecond earlier', () => {
    const { element, fired } = setup();

    fire(element, 'pointerdown', { x: 4, y: 8 });
    advance(PressExtensions.longPressDelay.default - 1);
    expect(fired).toHaveLength(0);

    advance(1);
    expect(fired).toHaveLength(1);
    expect(fired[0]?.x).toBe(4); // the press ORIGIN, not wherever the pointer drifted to
    expect(fired[0]?.y).toBe(8);
  });

  it('clamps a too-short delay up to the shared minimum', () => {
    // Proof the bounds come from `PressExtensions`, not from a constant invented in this slice.
    const { element, fired } = setup({ delayMs: 10 });

    advanceThroughPress(element, PressExtensions.longPressDelay.min - 1);
    expect(fired).toHaveLength(0);

    advance(1);
    expect(fired).toHaveLength(1);
  });

  /** Presses, then advances by `ms` — keeps the clamp test readable. */
  function advanceThroughPress(element: HTMLElement, ms: number): void {
    fire(element, 'pointerdown', { x: 0, y: 0 });
    advance(ms);
  }

  it('cancels when the pointer is released early', () => {
    const { element, fired } = setup({ delayMs: 500 });

    fire(element, 'pointerdown', { x: 0, y: 0 });
    advance(200);
    fire(element, 'pointerup', { x: 0, y: 0 });
    advance(1_000);

    expect(fired).toHaveLength(0);
  });

  it('cancels when the pointer moves beyond the tolerance', () => {
    const { element, fired } = setup({ delayMs: 500, moveTolerance: 10 });

    fire(element, 'pointerdown', { x: 0, y: 0 });
    advance(200);
    fire(element, 'pointermove', { x: 0, y: 50 });
    advance(1_000);

    expect(fired).toHaveLength(0);
  });

  it('survives drift within the tolerance — no real finger is still', () => {
    const { element, fired } = setup({ delayMs: 500, moveTolerance: 10 });

    fire(element, 'pointerdown', { x: 0, y: 0 });
    advance(200);
    fire(element, 'pointermove', { x: 3, y: 4 }); // 5px of tremor
    advance(300);

    expect(fired).toHaveLength(1);
  });

  it('cancels on pointercancel', () => {
    const { element, fired } = setup({ delayMs: 500 });

    fire(element, 'pointerdown', { x: 0, y: 0 });
    fire(element, 'pointercancel', { x: 0, y: 0 });
    advance(1_000);

    expect(fired).toHaveLength(0);
  });

  it('clears a pending timer on unmount', () => {
    const { element, fired, unmount } = setup({ delayMs: 500 });

    fire(element, 'pointerdown', { x: 0, y: 0 });
    advance(200);
    unmount();
    advance(1_000);

    // A dangling timer here would fire a handler into an unmounted tree.
    expect(fired).toHaveLength(0);
  });

  it('does nothing when disabled', () => {
    const { element, fired } = setup({ delayMs: 500, disabled: true });

    fire(element, 'pointerdown', { x: 0, y: 0 });
    advance(1_000);

    expect(fired).toHaveLength(0);
  });
});

describe('usePinch', () => {
  /** Renders `usePinch` on a fresh element, collecting every payload it emits. */
  function setup(options?: Parameters<typeof usePinch>[2]) {
    const { element, ref } = mountTarget();
    const starts: PinchPayload[] = [];
    const moves: PinchPayload[] = [];
    const ends: PinchPayload[] = [];
    const view = renderHook(() =>
      usePinch(
        ref,
        {
          onPinchStart: (payload) => starts.push(payload),
          onPinchMove: (payload) => moves.push(payload),
          onPinchEnd: (payload) => ends.push(payload),
        },
        options,
      ),
    );
    return { element, starts, moves, ends, unmount: view.unmount };
  }

  it('ignores a single pointer', () => {
    const { element, starts, moves } = setup();

    fire(element, 'pointerdown', { pointerId: 1, x: 0, y: 0 });
    fire(element, 'pointermove', { pointerId: 1, x: 50, y: 50 });

    expect(starts).toHaveLength(0);
    expect(moves).toHaveLength(0);
  });

  it('starts at scale 1 when the second pointer lands', () => {
    const { element, starts } = setup();

    fire(element, 'pointerdown', { pointerId: 1, x: 0, y: 0 });
    fire(element, 'pointerdown', { pointerId: 2, x: 100, y: 0 });

    expect(starts).toHaveLength(1);
    expect(starts[0]?.scale).toBe(1);
    expect(starts[0]?.rotation).toBe(0);
    expect(starts[0]?.center).toEqual({ x: 50, y: 0 });
  });

  it('reports scale and centre as the pointers separate', () => {
    const { element, moves } = setup();

    fire(element, 'pointerdown', { pointerId: 1, x: 0, y: 0 });
    fire(element, 'pointerdown', { pointerId: 2, x: 100, y: 0 });
    fire(element, 'pointermove', { pointerId: 2, x: 200, y: 0 });

    expect(moves).toHaveLength(1);
    expect(moves[0]?.scale).toBeCloseTo(2, 10);
    expect(moves[0]?.center).toEqual({ x: 100, y: 0 });
  });

  it('reports rotation measured from the pinch origin', () => {
    const { element, moves } = setup();

    fire(element, 'pointerdown', { pointerId: 1, x: 0, y: 0 });
    fire(element, 'pointerdown', { pointerId: 2, x: 100, y: 0 });
    fire(element, 'pointermove', { pointerId: 2, x: 0, y: 100 }); // a quarter turn clockwise on screen

    expect(moves[0]?.rotation).toBeCloseTo(90, 10);
    expect(moves[0]?.scale).toBeCloseTo(1, 10); // separation unchanged — rotation must not leak into scale
  });

  it('is reversible — returning to the origin returns scale to 1', () => {
    const { element, moves } = setup();

    fire(element, 'pointerdown', { pointerId: 1, x: 0, y: 0 });
    fire(element, 'pointerdown', { pointerId: 2, x: 100, y: 0 });
    fire(element, 'pointermove', { pointerId: 2, x: 300, y: 0 });
    fire(element, 'pointermove', { pointerId: 2, x: 100, y: 0 });

    // Anchoring to the pinch origin rather than compounding per-frame deltas is what guarantees this.
    expect(moves.at(-1)?.scale).toBe(1);
    expect(moves.at(-1)?.rotation).toBe(0);
  });

  it('ends when one of the pair lifts', () => {
    const { element, ends } = setup();

    fire(element, 'pointerdown', { pointerId: 1, x: 0, y: 0 });
    fire(element, 'pointerdown', { pointerId: 2, x: 100, y: 0 });
    fire(element, 'pointermove', { pointerId: 2, x: 200, y: 0 });
    fire(element, 'pointerup', { pointerId: 2, x: 200, y: 0 });

    expect(ends).toHaveLength(1);
    expect(ends[0]?.scale).toBeCloseTo(2, 10); // the last real geometry, not a hole where an anchor used to be
  });

  it('ignores a spectator pointer that is not part of the active pair', () => {
    const { element, moves } = setup();

    fire(element, 'pointerdown', { pointerId: 1, x: 0, y: 0 });
    fire(element, 'pointerdown', { pointerId: 2, x: 100, y: 0 });
    fire(element, 'pointerdown', { pointerId: 3, x: 300, y: 300 });
    fire(element, 'pointermove', { pointerId: 3, x: 400, y: 400 });

    expect(moves).toHaveLength(0);
  });

  it('re-arms on the pointers still down when an anchor lifts', () => {
    const { element, starts, ends } = setup();

    fire(element, 'pointerdown', { pointerId: 1, x: 0, y: 0 });
    fire(element, 'pointerdown', { pointerId: 2, x: 100, y: 0 });
    fire(element, 'pointerdown', { pointerId: 3, x: 200, y: 0 });
    fire(element, 'pointerup', { pointerId: 1, x: 0, y: 0 });

    // A rolling hand gets a clean end + a fresh start, never a transform that teleports as anchors swap.
    expect(ends).toHaveLength(1);
    expect(starts).toHaveLength(2);
    expect(starts.at(-1)?.scale).toBe(1);
  });

  it('releases every held capture on unmount', () => {
    const { element, ref } = mountTarget();
    const releaseCapture = vi.fn();
    element.setPointerCapture = vi.fn();
    element.releasePointerCapture = releaseCapture;
    element.hasPointerCapture = () => true;

    const { unmount } = renderHook(() => usePinch(ref, {}));
    fire(element, 'pointerdown', { pointerId: 1, x: 0, y: 0 });
    fire(element, 'pointerdown', { pointerId: 2, x: 100, y: 0 });

    unmount();

    expect(releaseCapture).toHaveBeenCalledWith(1);
    expect(releaseCapture).toHaveBeenCalledWith(2);
  });

  it('does nothing when disabled', () => {
    const { element, starts } = setup({ disabled: true });

    fire(element, 'pointerdown', { pointerId: 1, x: 0, y: 0 });
    fire(element, 'pointerdown', { pointerId: 2, x: 100, y: 0 });

    expect(starts).toHaveLength(0);
  });
});
