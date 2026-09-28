import { describe, expect, it } from 'vitest';
import {
  contrastPairRatio,
  contrastPairs,
  contrastRatio,
  generateTheme,
  getTheme,
  Oklch,
  oklchToHex,
  parseColor,
  readableForeground,
  SemanticTokens,
  THEMES,
  themeToCss,
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
    for (const token of SemanticTokens) {
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

  it('scores each public pair with the ratio the validator gates on', () => {
    const failing = (['light', 'dark'] as const).flatMap((mode) =>
      contrastPairs().filter((pair) => !(contrastPairRatio(theme[mode], pair) >= pair.min)),
    );
    expect(failing.length === 0).toBe(theme.meta.contrastAA);
    const translucent = contrastPairs().find((pair) => pair.bg === 'primary' && pair.opacity !== undefined)!;
    // A translucent fill composites over its host surface, so it never scores like the opaque token.
    expect(contrastPairRatio(theme.light, translucent)).not.toBe(
      contrastRatio(parseColor(theme.light[translucent.fg])!, parseColor(theme.light[translucent.bg])!),
    );
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

it('rejects malformed OKLCH numeric fields instead of accepting parseFloat prefixes', () => {
  expect(parseColor('oklch(50..2% 0.1 30)')).toBeNull();
  expect(parseColor('oklch(. 0.1 30)')).toBeNull();
  expect(parseColor('oklch(50% 0.1 -30)')?.h).toBe(330);
});
it('resolves catalog entries consistently through lookup and array access', () => {
  const theme = getTheme('wow');
  expect(theme).toBeDefined();
  expect(THEMES.find((entry) => entry.id === 'wow')).toBe(theme);
  expect(getTheme('wow')).toBe(theme);
  expect(getTheme('missing-theme')).toBeUndefined();
});

it('ships the Wheelhouse directions with their glass backdrops, AA in both modes', () => {
  const ids = ['glass-harbor', 'frost', 'bento-deck', 'harbor-frost'];
  for (const id of ids) {
    const theme = getTheme(id);
    expect(theme, id).toBeDefined();
    expect(theme!.meta.contrastAA, `${id}: ${theme!.meta.failures?.join('; ')}`).toBe(true);
  }
  const css = themeToCss(getTheme('harbor-frost')!);
  const [light, dark] = css.split('\n\n');
  expect(light).toContain('--theme-ambient: radial-gradient(');
  expect(dark).toContain('--theme-ambient: radial-gradient(');
  expect(light).not.toEqual(dark);
  expect(themeToCss(getTheme('bento-deck')!)).not.toContain('--theme-ambient');
});

describe('readableForeground', () => {
  it('picks the text pole with more contrast, and reads AA on saturated fills', () => {
    for (const fill of ['#1e3a8a', '#b91c1c', '#15803d', '#7c3aed', '#fde68a', '#e0f2fe', '#f97316']) {
      const text = readableForeground(fill)!;
      const ratio = contrastRatio(parseColor(text)!, parseColor(fill)!);
      expect(ratio, fill).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('returns null for colors the engine cannot parse', () => {
    expect(readableForeground('var(--brand)')).toBeNull();
    expect(readableForeground('rebeccapurple')).toBeNull();
    expect(readableForeground(undefined)).toBeNull();
  });
});
