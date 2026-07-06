/* ---------------------------------------------------------------------------
 * WCAG AA theme validator tests.
 *
 * Uses a synthetic monochrome token set (white surfaces, black ink → every
 * pair 21:1) as the known-good baseline, then breaks individual tokens to
 * assert the validator reports precise, useful violations.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest';
import { SEMANTIC_TOKENS, TONE_FAMILIES, type TokenSet } from './Tokens';
import { AA_TEXT, AA_UI, contrastPairs, validateTheme } from './validate';

const WHITE = '#ffffff';
const BLACK = '#000000';
// Mid grey: ~3.95:1 on white — passes the 3:1 UI bar, fails the 4.5:1 text bar.
const MID_GREY = '#808080';

/** All surfaces white, all text + ring black — every canonical pair hits 21:1. */
function monochromeSet(overrides: Partial<TokenSet> = {}): TokenSet {
  const set: Partial<TokenSet> = {};
  for (const token of SEMANTIC_TOKENS) {
    const isInk =
      token === 'foreground' || token.endsWith('-foreground') || token === 'ring';
    set[token] = isInk ? BLACK : WHITE;
  }
  return { ...(set as TokenSet), ...overrides };
}

describe('contrastPairs', () => {
  it('covers 7 surface pairs + solid/soft pairs for all 6 tone families', () => {
    const pairs = contrastPairs();
    expect(pairs).toHaveLength(7 + TONE_FAMILIES.length * 2);
    for (const family of TONE_FAMILIES) {
      expect(pairs).toContainEqual({ fg: `${family}-foreground`, bg: family, min: AA_TEXT });
      expect(pairs).toContainEqual({
        fg: `${family}-soft-foreground`,
        bg: `${family}-soft`,
        min: AA_TEXT,
      });
    }
  });

  it('holds only subtle-foreground and ring to the relaxed UI threshold', () => {
    const ui = contrastPairs().filter((p) => p.min === AA_UI);
    expect(ui.map((p) => `${p.fg} on ${p.bg}`)).toEqual([
      'subtle-foreground on background',
      'ring on background',
    ]);
  });
});

describe('validateTheme', () => {
  it('passes a known-good theme with no failures key', () => {
    const meta = validateTheme({ light: monochromeSet(), dark: monochromeSet() });
    expect(meta).toEqual({ contrastAA: true });
  });

  it('reports a broken surface pair with mode, tokens, ratio, and threshold', () => {
    const meta = validateTheme({
      light: monochromeSet({ foreground: WHITE }), // white on white
      dark: monochromeSet(),
    });
    expect(meta.contrastAA).toBe(false);
    expect(meta.failures).toEqual(['light: foreground on background = 1.00 (need 4.5)']);
  });

  it('reports a broken tone pair in dark mode only', () => {
    const meta = validateTheme({
      light: monochromeSet(),
      dark: monochromeSet({ 'success-foreground': WHITE }),
    });
    expect(meta.failures).toEqual(['dark: success-foreground on success = 1.00 (need 4.5)']);
  });

  it('accumulates failures across both modes, light first', () => {
    const meta = validateTheme({
      light: monochromeSet({ foreground: WHITE }),
      dark: monochromeSet({ 'primary-foreground': WHITE }),
    });
    expect(meta.failures).toEqual([
      'light: foreground on background = 1.00 (need 4.5)',
      'dark: primary-foreground on primary = 1.00 (need 4.5)',
    ]);
  });

  it('applies the 3:1 UI bar to ring but the 4.5:1 text bar to muted-foreground', () => {
    const meta = validateTheme({
      // Same grey both places: ring passes (≥3), muted-foreground fails (<4.5).
      light: monochromeSet({ ring: MID_GREY, 'muted-foreground': MID_GREY }),
      dark: monochromeSet(),
    });
    expect(meta.contrastAA).toBe(false);
    expect(meta.failures).toHaveLength(1);
    expect(meta.failures?.[0]).toContain('muted-foreground on muted');
    expect(meta.failures?.[0]).toContain('(need 4.5)');
  });

  it('fails closed on unparseable token values (treated as 1:1)', () => {
    const meta = validateTheme({
      light: monochromeSet({ foreground: 'not-a-color' }),
      dark: monochromeSet(),
    });
    expect(meta.contrastAA).toBe(false);
    expect(meta.failures).toEqual(['light: foreground on background = 1.00 (need 4.5)']);
  });
});
