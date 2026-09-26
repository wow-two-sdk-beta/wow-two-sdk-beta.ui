/* ---------------------------------------------------------------------------
 * Golden master over the full curated catalog (registry + pool + validated).
 *
 * Every theme must pass WCAG AA validation, except the ids listed in
 * KNOWN_AA_EXCEPTIONS. The list is asserted exactly: a NEW failure breaks the
 * suite, and a FIXED exception breaks it too (prune the list) — so the
 * exception stays visible instead of silently rotting.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest';
import { ThemeStatus } from '@src/foundation/themes/Theme';
import { SEMANTIC_TOKENS } from '@src/foundation/themes/Tokens';
import { candidateThemes, getTheme, THEME_IDS, THEMES, validatedThemes } from '@src/foundation/themes/registry';
import { validateTheme } from '@src/foundation/themes/validate';

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

/** The hand-authored candidates from `authored.ts`, in registry order. */
const AUTHORED_IDS = ['glass-harbor', 'frost', 'bento-deck', 'harbor-frost'];

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

  it('catalog shape: 187 themes (1 validated + 4 authored + 24 curated + 68 named + 90 spectrum), validated first, unique ids', () => {
    expect(THEMES).toHaveLength(187);
    expect(THEMES[0]?.id).toBe('smart-qr');
    expect(THEME_IDS.slice(1, 5)).toEqual(AUTHORED_IDS);
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

describe('authored themes', () => {
  it('are candidates on the large radius knob', () => {
    for (const id of AUTHORED_IDS) {
      expect(getTheme(id)?.status, id).toBe(ThemeStatus.Candidate);
      expect(getTheme(id)?.radius, id).toBe('lg');
    }
  });

  it('carry an ambient backdrop only for the glass directions', () => {
    const withBackdrop = AUTHORED_IDS.filter((id) => getTheme(id)?.ambient);
    expect(withBackdrop).toEqual(['glass-harbor', 'frost', 'harbor-frost']);
  });

  it('pair Frost by day with Glass Harbor by night in harbor-frost', () => {
    const merged = getTheme('harbor-frost');
    expect(merged?.light).toBe(getTheme('frost')?.light);
    expect(merged?.dark).toBe(getTheme('glass-harbor')?.dark);
    expect(merged?.ambient).toEqual({
      light: getTheme('frost')?.ambient?.light,
      dark: getTheme('glass-harbor')?.ambient?.dark,
    });
  });
});
