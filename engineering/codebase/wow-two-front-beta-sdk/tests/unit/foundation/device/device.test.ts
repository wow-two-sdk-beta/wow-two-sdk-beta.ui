import { describe, expect, it } from 'vitest';

import {
  MAX_BREAKPOINTS,
  TAILWIND_BREAKPOINTS,
  resolveBreakpoint,
  toBreakpointQueries,
  type BreakpointQuery,
} from '@src/foundation/device/Breakpoints';
import { DisplayMode } from '@src/foundation/device/DisplayMode';
import { Platform, getPlatform } from '@src/foundation/device/Platform';
import { PointerType } from '@src/foundation/device/PointerType';

// Node project — only the DOM-free half of the slice. The hooks live in `device.browser.test.ts`.
//
// Imports reach the modules directly rather than the `@src/foundation/device` barrel: the barrel pulls in the
// hooks, which pull in React and `foundation/hooks`, none of which this file exercises. `getPlatform` is driven
// entirely through its `hint` parameter so the result never depends on the OS running the suite.

/** Builds a widest-first query list from plain pairs, for `resolveBreakpoint` cases that skip the compiler. */
function queries(...entries: readonly (readonly [string, number])[]): readonly BreakpointQuery[] {
  return entries.map(([key, minWidth]) => ({ key, minWidth, query: `(min-width: ${minWidth}px)` }));
}

describe('getPlatform', () => {
  it('detects Apple from every form of the hint', () => {
    expect(getPlatform('MacIntel')).toBe(Platform.Apple);
    expect(getPlatform('macOS')).toBe(Platform.Apple);
    expect(getPlatform('iPhone')).toBe(Platform.Apple);
    expect(getPlatform('iPad')).toBe(Platform.Apple);
    expect(getPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(Platform.Apple);
  });

  it('detects Windows from the UA, `navigator.platform`, and `userAgentData` spellings', () => {
    expect(getPlatform('Windows')).toBe(Platform.Windows);
    expect(getPlatform('Win32')).toBe(Platform.Windows);
    expect(getPlatform('Win64')).toBe(Platform.Windows);
    expect(getPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(Platform.Windows);
    expect(getPlatform('Mozilla/5.0 (Windows NT 6.1; WOW64)')).toBe(Platform.Windows);
  });

  it('reads Android before Linux, though Android names the Linux kernel', () => {
    expect(getPlatform('Android')).toBe(Platform.Android);
    expect(getPlatform('Linux armv8l; Android 13')).toBe(Platform.Android);
    expect(getPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe(Platform.Android);
  });

  it('folds desktop Linux, X11, and ChromeOS into one family', () => {
    expect(getPlatform('Linux x86_64')).toBe(Platform.Linux);
    expect(getPlatform('X11; Ubuntu')).toBe(Platform.Linux);
    expect(getPlatform('CrOS x86_64 14541.0.0')).toBe(Platform.Linux);
    expect(getPlatform('Chrome OS')).toBe(Platform.Linux);
  });

  it('does not misread `Darwin` as Windows', () => {
    // "Darwin" contains "win" — a bare /win/i pattern would turn a Mac into a PC, so the guard is pinned here.
    expect(getPlatform('Darwin/23.0.0')).not.toBe(Platform.Windows);
  });

  it('falls back to unknown for an empty or unrecognised hint', () => {
    expect(getPlatform('')).toBe(Platform.Unknown);
    expect(getPlatform('FreeBSD amd64')).toBe(Platform.Unknown);
    expect(getPlatform('   ')).toBe(Platform.Unknown);
  });

  it('returns a valid family and never throws with no hint at all', () => {
    // Under the node project there is no `navigator`, which is the SSR path — it must answer, not crash.
    expect(Object.values(Platform)).toContain(getPlatform());
  });
});

describe('toBreakpointQueries', () => {
  it('compiles a scale to widest-first min-width queries', () => {
    expect(toBreakpointQueries({ sm: 640, lg: 1024, md: 768 })).toEqual([
      { key: 'lg', minWidth: 1024, query: '(min-width: 1024px)' },
      { key: 'md', minWidth: 768, query: '(min-width: 768px)' },
      { key: 'sm', minWidth: 640, query: '(min-width: 640px)' },
    ]);
  });

  it('drops entries whose width is not a finite, non-negative number', () => {
    const compiled = toBreakpointQueries({
      ok: 500,
      nan: Number.NaN,
      infinite: Number.POSITIVE_INFINITY,
      negative: -1,
    });

    expect(compiled.map((entry) => entry.key)).toEqual(['ok']);
  });

  it('keeps a zero-width entry, which is a query that always matches', () => {
    expect(toBreakpointQueries({ base: 0 })).toEqual([
      { key: 'base', minWidth: 0, query: '(min-width: 0px)' },
    ]);
  });

  it('returns nothing for an empty scale', () => {
    expect(toBreakpointQueries({})).toEqual([]);
  });
});

describe('resolveBreakpoint', () => {
  it('returns the first matching key, which is the widest one', () => {
    const compiled = queries(['lg', 1024], ['md', 768], ['sm', 640]);

    expect(resolveBreakpoint(compiled, [false, true, true])).toBe('md');
    expect(resolveBreakpoint(compiled, [true, true, true])).toBe('lg');
    expect(resolveBreakpoint(compiled, [false, false, true])).toBe('sm');
  });

  it('returns null when nothing matches — the mobile-first base band has no key', () => {
    expect(resolveBreakpoint(queries(['lg', 1024], ['sm', 640]), [false, false])).toBeNull();
    expect(resolveBreakpoint([], [])).toBeNull();
  });

  it('treats a short matches array as "did not match" for the missing tail', () => {
    // This is how a scale larger than MAX_BREAKPOINTS loses its narrowest entries.
    expect(resolveBreakpoint(queries(['lg', 1024], ['sm', 640]), [false])).toBeNull();
    expect(resolveBreakpoint(queries(['lg', 1024], ['sm', 640]), [true])).toBe('lg');
  });
});

describe('constants', () => {
  it('ships the Tailwind v4 defaults, small enough to fit the slot cap', () => {
    expect(TAILWIND_BREAKPOINTS).toEqual({ sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 });
    expect(Object.keys(TAILWIND_BREAKPOINTS).length).toBeLessThanOrEqual(MAX_BREAKPOINTS);
  });

  it('exposes the vocabularies the hooks return', () => {
    expect(Object.values(PointerType)).toEqual(['coarse', 'fine', 'none']);
    expect(Object.values(DisplayMode)).toEqual(['standalone', 'fullscreen', 'minimal-ui', 'browser']);
    expect(Object.values(Platform)).toEqual(['apple', 'windows', 'android', 'linux', 'unknown']);
  });
});
