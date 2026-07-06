/* ---------------------------------------------------------------------------
 * Golden master over the full curated catalog (registry + pool + validated).
 *
 * Every theme must pass WCAG AA validation, except the ids listed in
 * KNOWN_AA_EXCEPTIONS. The list is asserted exactly: a NEW failure breaks the
 * suite, and a FIXED exception breaks it too (prune the list) — so the
 * exception stays visible instead of silently rotting.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest';
import { ThemeStatus } from './Theme';
import { SEMANTIC_TOKENS } from './Tokens';
import { candidateThemes, getTheme, THEME_IDS, THEMES, validatedThemes } from './registry';
import { validateTheme } from './validate';

/**
 * Themes known NOT to clear AA — the build's "182/183 proven" gap.
 *
 * `smart-qr` is the hand-authored VALIDATED theme: its colors are copied
 * verbatim from the shipping Smart QR app and are locked (never AA-nudged —
 * see `validated.ts`), so it keeps `status: "validated"` despite 11 failing
 * pairs (e.g. `light: subtle-foreground on background = 1.93`,
 * `dark: info-foreground on info = 2.43`). Do NOT "fix" the theme; if it is
 * ever re-authored to clear AA, prune it from this list.
 */
const KNOWN_AA_EXCEPTIONS: string[] = ['smart-qr'];

const SORTED_TOKENS = [...SEMANTIC_TOKENS].sort();

describe('theme catalog golden master', () => {
  it('every theme passes AA validation, modulo the known exceptions', () => {
    const failing = THEMES.filter((t) => !validateTheme(t).contrastAA).map((t) => t.id);
    expect(failing).toEqual(KNOWN_AA_EXCEPTIONS);
  });

  it('recorded meta.contrastAA is honest — matches a fresh validation for all themes', () => {
    for (const theme of THEMES) {
      expect(validateTheme(theme).contrastAA, theme.id).toBe(theme.meta.contrastAA);
    }
  });

  it('catalog shape: 183 themes (1 validated + 24 curated + 68 named + 90 spectrum), validated first, unique ids', () => {
    expect(THEMES).toHaveLength(183);
    expect(THEMES[0]?.id).toBe('smart-qr');
    expect(new Set(THEME_IDS).size).toBe(THEMES.length);
    expect(THEME_IDS).toEqual(THEMES.map((t) => t.id));
  });

  it('every theme carries the complete 39-token contract in both modes', () => {
    for (const theme of THEMES) {
      expect(Object.keys(theme.light).sort(), `${theme.id} light`).toEqual(SORTED_TOKENS);
      expect(Object.keys(theme.dark).sort(), `${theme.id} dark`).toEqual(SORTED_TOKENS);
    }
  });
});

describe('registry lookups', () => {
  it('getTheme finds by id and returns undefined for unknown ids', () => {
    expect(getTheme('wow')?.name).toBe('WoW');
    expect(getTheme('smart-qr')?.status).toBe(ThemeStatus.Validated);
    expect(getTheme('does-not-exist')).toBeUndefined();
  });

  it('validated/candidate partition the catalog, with smart-qr the only validated theme', () => {
    const validated = validatedThemes();
    const candidates = candidateThemes();
    expect(validated.map((t) => t.id)).toEqual(['smart-qr']);
    expect(candidates.every((t) => t.status === ThemeStatus.Candidate)).toBe(true);
    expect(validated.length + candidates.length).toBe(THEMES.length);
  });
});
