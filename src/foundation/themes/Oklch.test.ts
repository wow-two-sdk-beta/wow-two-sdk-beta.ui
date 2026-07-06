/* ---------------------------------------------------------------------------
 * OKLCH color engine tests.
 *
 * Reference OKLCH values for the sRGB primaries come from Ottosson's OKLab
 * reference implementation / CSS Color 4; WCAG pairs from the 2.1 formula
 * (black-on-white = 21:1, #767676-on-white ≈ 4.54:1, same color = 1:1).
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest';
import {
  clampChromaToGamut,
  contrastRatio,
  contrastRatioCss,
  isInSrgbGamut,
  normalizeHue,
  oklchToCss,
  oklchToHex,
  parseColor,
  relativeLuminance,
  type Oklch,
} from './Oklch';

const WHITE: Oklch = { l: 1, c: 0, h: 0 };
const BLACK: Oklch = { l: 0, c: 0, h: 0 };

/** Parse or fail loudly — keeps call sites free of null-checks. */
function parse(value: string): Oklch {
  const color = parseColor(value);
  if (!color) throw new Error(`parseColor returned null for ${value}`);
  return color;
}

describe('normalizeHue', () => {
  it.each([
    [0, 0],
    [30.5, 30.5],
    [359.9, 359.9],
    [360, 0],
    [540, 180],
    [720, 0],
    [-90, 270],
    [-360, 0],
  ])('wraps %f into [0,360) as %f', (input, expected) => {
    expect(normalizeHue(input)).toBeCloseTo(expected, 10);
  });
});

describe('isInSrgbGamut', () => {
  it.each<[string, Oklch, boolean]>([
    ['white', WHITE, true],
    ['black', BLACK, true],
    ['mid grey', { l: 0.5, c: 0, h: 0 }, true],
    ['near-primary red (inside boundary)', { l: 0.628, c: 0.25, h: 29.2 }, true],
    ['red with chroma past the boundary', { l: 0.628, c: 0.35, h: 29.2 }, false],
    ['bright saturated blue (impossible in sRGB)', { l: 0.9, c: 0.3, h: 264 }, false],
    ['very dark saturated green', { l: 0.05, c: 0.2, h: 150 }, false],
  ])('%s → %s', (_label, color, expected) => {
    expect(isInSrgbGamut(color)).toBe(expected);
  });
});

describe('clampChromaToGamut', () => {
  it('returns in-gamut colors unchanged (same reference)', () => {
    const color: Oklch = { l: 0.6, c: 0.1, h: 150 };
    expect(clampChromaToGamut(color)).toBe(color);
  });

  it('reduces only chroma until the color fits the gamut', () => {
    const wild: Oklch = { l: 0.5, c: 0.4, h: 150 };
    const clamped = clampChromaToGamut(wild);
    expect(clamped.l).toBe(wild.l);
    expect(clamped.h).toBe(wild.h);
    expect(clamped.c).toBeGreaterThan(0);
    expect(clamped.c).toBeLessThan(wild.c);
    expect(isInSrgbGamut(clamped)).toBe(true);
  });

  it('clamps to (near) the gamut boundary, not conservatively below it', () => {
    const clamped = clampChromaToGamut({ l: 0.5, c: 0.4, h: 150 });
    expect(isInSrgbGamut({ ...clamped, c: clamped.c + 0.005 })).toBe(false);
  });
});

describe('oklchToHex', () => {
  it.each<[string, Oklch, string]>([
    ['white', WHITE, '#ffffff'],
    ['black', BLACK, '#000000'],
  ])('%s → %s', (_label, color, hex) => {
    expect(oklchToHex(color)).toBe(hex);
  });

  it('renders achromatic colors with equal channels', () => {
    expect(oklchToHex({ l: 0.5, c: 0, h: 0 })).toMatch(/^#([\da-f]{2})\1\1$/);
  });

  // hex → OKLCH → hex must reproduce the exact 8-bit values (lossless within rounding).
  it.each([
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#7c3aed',
    '#0d9488',
    '#18181b',
    '#fafafa',
  ])('round-trips %s through OKLCH', (hex) => {
    expect(oklchToHex(parse(hex))).toBe(hex);
  });

  it('gamut-clamps out-of-gamut input before converting', () => {
    const wild: Oklch = { l: 0.5, c: 0.4, h: 150 };
    expect(oklchToHex(wild)).toBe(oklchToHex(clampChromaToGamut(wild)));
    expect(oklchToHex(wild)).toMatch(/^#[\da-f]{6}$/);
  });
});

describe('oklchToCss', () => {
  it('formats as oklch(L% C H) with fixed precision', () => {
    expect(oklchToCss({ l: 0.625, c: 0.2, h: 30 })).toBe('oklch(62.5% 0.2000 30.0)');
    expect(oklchToCss(WHITE)).toBe('oklch(100.0% 0.0000 0.0)');
  });

  it('normalizes the hue', () => {
    expect(oklchToCss({ l: 0.5, c: 0, h: 390 })).toBe('oklch(50.0% 0.0000 30.0)');
  });
});

describe('parseColor', () => {
  // Canonical OKLCH coordinates of the sRGB primaries (Ottosson / CSS Color 4).
  it.each([
    ['#ff0000', 0.628, 0.2577, 29.23],
    ['#00ff00', 0.8664, 0.2948, 142.5],
    ['#0000ff', 0.452, 0.3132, 264.05],
  ])('parses %s to its reference OKLCH coordinates', (hex, l, c, h) => {
    const color = parse(hex);
    expect(color.l).toBeCloseTo(l, 3);
    expect(color.c).toBeCloseTo(c, 3);
    expect(color.h).toBeCloseTo(h, 1);
  });

  it('expands #rgb shorthand to #rrggbb', () => {
    expect(parse('#fff')).toEqual(parse('#ffffff'));
    expect(parse('#abc')).toEqual(parse('#aabbcc'));
  });

  it('reads oklch() lightness as percent or 0–1 number', () => {
    expect(parse('oklch(62.5% 0.2 30)')).toEqual({ l: 0.625, c: 0.2, h: 30 });
    expect(parse('oklch(0.625 0.2 30)')).toEqual({ l: 0.625, c: 0.2, h: 30 });
  });

  it('round-trips an in-gamut color through oklchToCss within emit rounding', () => {
    // Must be inside the sRGB gamut — oklchToCss chroma-clamps before emitting.
    const color: Oklch = { l: 0.6, c: 0.1, h: 150 };
    const back = parse(oklchToCss(color));
    expect(back.l).toBeCloseTo(color.l, 3);
    expect(back.c).toBeCloseTo(color.c, 4);
    expect(back.h).toBeCloseTo(color.h, 1);
  });

  it.each([
    'red',
    '',
    '#12345',
    '#1234567',
    '#gggggg',
    'rgb(255 0 0)',
    'oklch()',
  ])('returns null for malformed input %j', (value) => {
    expect(parseColor(value)).toBeNull();
  });
});

describe('relativeLuminance', () => {
  it('is 1 for white and 0 for black', () => {
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 6);
    expect(relativeLuminance(BLACK)).toBeCloseTo(0, 6);
  });

  it('increases with OKLCH lightness', () => {
    expect(relativeLuminance({ l: 0.8, c: 0, h: 0 })).toBeGreaterThan(
      relativeLuminance({ l: 0.4, c: 0, h: 0 }),
    );
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white (WCAG maximum)', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 6);
  });

  it('is 1 for a color against itself (WCAG minimum)', () => {
    const color: Oklch = { l: 0.62, c: 0.15, h: 264 };
    expect(contrastRatio(color, color)).toBeCloseTo(1, 10);
  });

  it('is symmetric', () => {
    const a: Oklch = { l: 0.3, c: 0.1, h: 30 };
    const b: Oklch = { l: 0.8, c: 0.05, h: 200 };
    expect(contrastRatio(a, b)).toBe(contrastRatio(b, a));
  });
});

describe('contrastRatioCss', () => {
  it.each([
    ['#000000', '#ffffff', 21],
    // The canonical "just passes AA" grey.
    ['#767676', '#ffffff', 4.54],
    ['#ffffff', '#ffffff', 1],
  ])('%s vs %s ≈ %f', (a, b, expected) => {
    expect(contrastRatioCss(a, b)).toBeCloseTo(expected, 2);
  });

  it('accepts mixed oklch()/hex inputs', () => {
    expect(contrastRatioCss('oklch(100% 0 0)', '#000000')).toBeCloseTo(21, 6);
  });

  it('falls back to 1 when either side is unparseable', () => {
    expect(contrastRatioCss('nope', '#ffffff')).toBe(1);
    expect(contrastRatioCss('#ffffff', 'nope')).toBe(1);
  });
});
