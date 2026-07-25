import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  DisplayMode,
  PointerType,
  TAILWIND_BREAKPOINTS,
  useBreakpoint,
  useDisplayMode,
  useHoverCapability,
  useIsInstalled,
  useOnlineStatus,
  usePointerType,
} from '@src/foundation/device';

// Browser project — real chromium, so `matchMedia` and the `online` / `offline` events are the genuine articles.
//
// The media-query hooks are asserted against an ORACLE built from `window.matchMedia` directly, not against a
// hardcoded `'fine'` / `'browser'`. What the harness's viewport and input configuration report is the harness's
// business; what this slice owns is the DERIVATION — which query wins, and in what order — and the oracle pins
// exactly that while staying green on any runner. Where a value is structurally guaranteed (an unreachable
// breakpoint, the slot cap) the expectation is spelled out literally instead.

afterEach(cleanup);

/** Dispatches a real window event inside `act`, so the listener attached in an effect is installed first. */
function fireWindowEvent(type: 'online' | 'offline'): void {
  act(() => {
    window.dispatchEvent(new Event(type));
  });
}

/** The widest breakpoint the live viewport satisfies, read straight from `matchMedia`. */
function expectedBreakpoint(scale: Readonly<Record<string, number>>): string | null {
  const widestFirst = [...Object.entries(scale)].sort(([, left], [, right]) => right - left);
  for (const [key, minWidth] of widestFirst) {
    if (window.matchMedia(`(min-width: ${minWidth}px)`).matches) return key;
  }
  return null;
}

// Scales live at module scope so their identity is stable across renders, as the hook's docs recommend.
const UNREACHABLE = 900_000;

/** Nine entries — one over the cap. Sorted widest-first, `tiny` is last, so it is the entry that loses its slot. */
const OVER_CAP_SCALE = {
  a: UNREACHABLE + 1,
  b: UNREACHABLE + 2,
  c: UNREACHABLE + 3,
  d: UNREACHABLE + 4,
  e: UNREACHABLE + 5,
  f: UNREACHABLE + 6,
  g: UNREACHABLE + 7,
  h: UNREACHABLE + 8,
  tiny: 0,
} as const;

/** The same shape trimmed to exactly the cap — `tiny` now gets the last slot and wins. */
const AT_CAP_SCALE = {
  a: UNREACHABLE + 1,
  b: UNREACHABLE + 2,
  c: UNREACHABLE + 3,
  d: UNREACHABLE + 4,
  e: UNREACHABLE + 5,
  f: UNREACHABLE + 6,
  g: UNREACHABLE + 7,
  tiny: 0,
} as const;

const ALWAYS_SCALE = { base: 0 } as const;
const NEVER_SCALE = { huge: UNREACHABLE } as const;
const EMPTY_SCALE = {} as const;

// A scale straddling the LIVE viewport, so one entry resolves for real. The harness runs narrow (414px at the time
// of writing — under Tailwind's `sm`), which would leave every fixed scale in the null base band and make a
// "resolves the right key" assertion pass without ever picking one. The ±100px margins keep it clear of scrollbar
// width, so `active` matches and `wide` does not, whatever viewport the runner uses.
const STRADDLE_SCALE = {
  base: 0,
  active: Math.max(1, window.innerWidth - 100),
  wide: window.innerWidth + 100,
};

describe('usePointerType', () => {
  it('derives the pointer type from the pointer media features', () => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const expected = fine ? PointerType.Fine : coarse ? PointerType.Coarse : PointerType.None;

    const { result } = renderHook(() => usePointerType());

    expect(result.current).toBe(expected);
  });

  it('always returns a member of the vocabulary', () => {
    const { result } = renderHook(() => usePointerType());

    expect(Object.values(PointerType)).toContain(result.current);
  });
});

describe('useHoverCapability', () => {
  it('tracks the hover media feature', () => {
    const { result } = renderHook(() => useHoverCapability());

    expect(result.current).toBe(window.matchMedia('(hover: hover)').matches);
  });
});

describe('useOnlineStatus', () => {
  it('seeds from navigator.onLine', () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(navigator.onLine);
  });

  it('flips to false on an offline event and back on an online event', () => {
    const { result } = renderHook(() => useOnlineStatus());

    fireWindowEvent('offline');
    expect(result.current).toBe(false);

    fireWindowEvent('online');
    expect(result.current).toBe(true);
  });

  it('survives repeated events of the same kind', () => {
    const { result } = renderHook(() => useOnlineStatus());

    fireWindowEvent('offline');
    fireWindowEvent('offline');
    expect(result.current).toBe(false);
  });

  it('detaches on unmount and does not leak into a later mount', () => {
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();
    fireWindowEvent('offline');

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(navigator.onLine);
  });
});

describe('useDisplayMode', () => {
  it('derives the mode from the display-mode queries, most specific first', () => {
    const matched = [DisplayMode.Fullscreen, DisplayMode.Standalone, DisplayMode.MinimalUi].find(
      (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
    );

    const { result } = renderHook(() => useDisplayMode());

    expect(result.current).toBe(matched ?? DisplayMode.Browser);
  });

  it('reports an ordinary test tab as browser', () => {
    const { result } = renderHook(() => useDisplayMode());

    expect(result.current).toBe(DisplayMode.Browser);
  });
});

describe('useIsInstalled', () => {
  it('is the complement of the browser display mode', () => {
    const { result: mode } = renderHook(() => useDisplayMode());
    const { result } = renderHook(() => useIsInstalled());

    expect(result.current).toBe(mode.current !== DisplayMode.Browser);
  });
});

describe('useBreakpoint', () => {
  it('resolves the widest matching breakpoint of the Tailwind scale', () => {
    const { result } = renderHook(() => useBreakpoint(TAILWIND_BREAKPOINTS));

    expect(result.current).toBe(expectedBreakpoint(TAILWIND_BREAKPOINTS));
  });

  it('picks the widest matching key, not the first or the narrowest', () => {
    // `base` also matches and `wide` does not; only the middle entry is the right answer.
    const { result } = renderHook(() => useBreakpoint(STRADDLE_SCALE));

    expect(result.current).toBe('active');
    expect(expectedBreakpoint(STRADDLE_SCALE)).toBe('active');
  });

  it('returns the key of a zero-width breakpoint, which always matches', () => {
    const { result } = renderHook(() => useBreakpoint(ALWAYS_SCALE));

    expect(result.current).toBe('base');
  });

  it('returns null below the narrowest breakpoint', () => {
    const { result } = renderHook(() => useBreakpoint(NEVER_SCALE));

    expect(result.current).toBeNull();
  });

  it('returns null for an empty scale', () => {
    const { result } = renderHook(() => useBreakpoint(EMPTY_SCALE));

    expect(result.current).toBeNull();
  });

  it('fills every slot when the scale is exactly at the cap', () => {
    const { result } = renderHook(() => useBreakpoint(AT_CAP_SCALE));

    expect(result.current).toBe('tiny');
  });

  it('ignores the narrowest entries once the scale exceeds the cap', () => {
    // One entry over the cap: `tiny` would have matched, but the eight wider (unreachable) entries take every
    // slot. Documented truncation, pinned here so a change to MAX_BREAKPOINTS surfaces as a failing test.
    const { result } = renderHook(() => useBreakpoint(OVER_CAP_SCALE));

    expect(result.current).toBeNull();
  });
});
