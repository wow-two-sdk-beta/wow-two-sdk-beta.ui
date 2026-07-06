/* ---------------------------------------------------------------------------
 * OKLCH theme generator tests — seed in, complete deterministic AA theme out.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest';
import { generateTheme } from './generate';
import { parseColor } from './Oklch';
import { ThemeStatus, type ThemeSeed } from './Theme';
import { SEMANTIC_TOKENS } from './Tokens';
import { validateTheme } from './validate';

const SEED: ThemeSeed = { id: 'unit-test', name: 'Unit Test', primaryHue: 264 };

const SORTED_TOKENS = [...SEMANTIC_TOKENS].sort();

describe('generateTheme', () => {
  it('produces the complete 39-token contract in both modes, every value parseable', () => {
    const theme = generateTheme(SEED);
    for (const set of [theme.light, theme.dark]) {
      expect(Object.keys(set).sort()).toEqual(SORTED_TOKENS);
      for (const token of SEMANTIC_TOKENS) {
        expect(parseColor(set[token]), `${token} = ${set[token]}`).not.toBeNull();
      }
    }
  });

  it('is deterministic — identical seeds yield identical themes', () => {
    expect(generateTheme(SEED)).toEqual(generateTheme({ ...SEED }));
  });

  it('is AA-proven out of the box and stamped candidate', () => {
    const theme = generateTheme(SEED);
    expect(theme.meta).toEqual({ contrastAA: true });
    // Re-validating the emitted token strings agrees with the recorded meta.
    expect(validateTheme(theme).contrastAA).toBe(true);
    expect(theme.status).toBe(ThemeStatus.Candidate);
    expect(theme.tags).toContain('aa');
  });

  it('derives description + auto-tags from seed defaults (neutral/complementary/crisp)', () => {
    const theme = generateTheme(SEED);
    expect(theme.description).toBe(
      'Generated theme · hue 264° · neutral neutrals · crisp surfaces.',
    );
    expect(theme.tags).toEqual(expect.arrayContaining(['neutral', 'complementary', 'crisp']));
  });

  it('merges seed tags with auto-tags, deduplicated', () => {
    const theme = generateTheme({ ...SEED, tags: ['brand', 'crisp'] });
    expect(theme.tags).toContain('brand');
    expect(theme.tags.filter((t) => t === 'crisp')).toHaveLength(1);
  });

  it('normalizes the primary hue — 624° generates the same tokens as 264°', () => {
    const wrapped = generateTheme({ ...SEED, primaryHue: 264 + 360 });
    const base = generateTheme(SEED);
    expect(wrapped.light).toEqual(base.light);
    expect(wrapped.dark).toEqual(base.dark);
  });

  it('mono accent mode reuses the primary family verbatim', () => {
    const theme = generateTheme({ ...SEED, accentMode: 'mono' });
    for (const set of [theme.light, theme.dark]) {
      expect(set.accent).toBe(set.primary);
      expect(set['accent-foreground']).toBe(set['primary-foreground']);
      expect(set['accent-soft']).toBe(set['primary-soft']);
      expect(set['accent-soft-foreground']).toBe(set['primary-soft-foreground']);
    }
  });

  it('carries the radius knob through (and omits it when unset)', () => {
    expect(generateTheme({ ...SEED, radius: 'lg' }).radius).toBe('lg');
    expect(generateTheme(SEED).radius).toBeUndefined();
  });

  // Representative option sweep — every combination must still emit a full AA theme.
  it.each<[string, ThemeSeed]>([
    [
      'warm analogous soft',
      { id: 's1', name: 'S1', primaryHue: 42, neutralTemp: 'warm', accentMode: 'analogous', surface: 'soft' },
    ],
    [
      'cool triadic crisp',
      { id: 's2', name: 'S2', primaryHue: 210, neutralTemp: 'cool', accentMode: 'triadic', surface: 'crisp' },
    ],
    [
      'neutral mono soft at hue 0',
      { id: 's3', name: 'S3', primaryHue: 0, neutralTemp: 'neutral', accentMode: 'mono', surface: 'soft' },
    ],
    [
      'warm complementary crisp near hue wrap',
      { id: 's4', name: 'S4', primaryHue: 359.9, neutralTemp: 'warm', accentMode: 'complementary', surface: 'crisp' },
    ],
  ])('generates a complete AA theme — %s', (_label, seed) => {
    const theme = generateTheme(seed);
    expect(Object.keys(theme.light)).toHaveLength(SEMANTIC_TOKENS.length);
    expect(Object.keys(theme.dark)).toHaveLength(SEMANTIC_TOKENS.length);
    expect(theme.meta.contrastAA).toBe(true);
  });
});
