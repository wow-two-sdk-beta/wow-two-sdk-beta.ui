import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  generateTheme,
  getTheme,
  Oklch,
  oklchToHex,
  parseColor,
  SEMANTIC_TOKENS,
  THEMES,
  ThemeStatus,
  validateTheme,
} from '@src/foundation/themes';

/*
 * Smoke depth, `unit` project (node). The engine is pure math over an OKLCH seed, so the two
 * things worth pinning are the ones a curated-theme drift would break silently:
 * the generator emits the FULL documented token set for both modes, and the color conversion
 * round-trips — a hue that drifts on the way out and back is a brand color the app renders
 * slightly wrong on every surface.
 */

describe('generateTheme', () => {
  const theme = generateTheme({ id: 'smoke-seed', name: 'Smoke Seed', primaryHue: 265 });

  it('emits every semantic token in both modes', () => {
    for (const token of SEMANTIC_TOKENS) {
      expect(theme.light[token], `light is missing \`${token}\``).toBeDefined();
      expect(theme.dark[token], `dark is missing \`${token}\``).toBeDefined();
    }
  });

  it('is deterministic — the same seed yields an identical theme', () => {
    const again = generateTheme({ id: 'smoke-seed', name: 'Smoke Seed', primaryHue: 265 });
    expect(again).toEqual(theme);
  });

  it('lands a generated theme at `candidate`, never `validated`', () => {
    expect(theme.status).toBe(ThemeStatus.Candidate);
  });

  it('carries a contrast verdict, and the validator agrees with it', () => {
    expect(validateTheme({ light: theme.light, dark: theme.dark }).contrastAA).toBe(theme.meta.contrastAA);
  });
});

describe('Oklch conversion', () => {
  it('round-trips a color through hex without drifting', () => {
    const source = { l: 0.62, c: 0.16, h: 265 };
    const back = parseColor(oklchToHex(source));

    expect(back).not.toBeNull();
    expect(back?.l).toBeCloseTo(source.l, 2);
    expect(back?.c).toBeCloseTo(source.c, 2);
    expect(back?.h).toBeCloseTo(source.h, 0);
  });

  it('normalizes a hue onto 0–360', () => {
    expect(Oklch.normalizeHue(400)).toBeCloseTo(40, 6);
    expect(Oklch.normalizeHue(-40)).toBeCloseTo(320, 6);
  });

  it('returns null for a value it cannot read, rather than a bogus color', () => {
    expect(parseColor('not a color')).toBeNull();
  });

  it('reports the maximum ratio for black against white', () => {
    expect(contrastRatio({ l: 0, c: 0, h: 0 }, { l: 1, c: 0, h: 0 })).toBeCloseTo(21, 0);
  });
});

describe('the curated registry', () => {
  it('resolves a shipped theme by id', () => {
    const first = THEMES[0];
    expect(first).toBeDefined();
    expect(getTheme(first?.id ?? '')).toBe(first);
  });
});
