/* ---------------------------------------------------------------------------
 * Validated themes — hand-authored from real, visually-verified app tokens.
 *
 * Unlike the curated registry (every preset is generated from a seed and
 * AA-nudged by the engine), a validated theme's colors are AUTHORED VERBATIM
 * from a shipping product and must never be re-derived — running them through
 * `generateTheme` would change the validated colors. So we build the full
 * 39-key light/dark TokenSets by hand: the app's bespoke overrides on top of
 * the lib's DEFAULT token values (the ones declared in `src/index.css`), which
 * the real app inherits for every token it doesn't override.
 *
 * We DO run `validateTheme` and record `meta` for transparency, but `status`
 * stays `validated` regardless of AA result — the human validated it visually.
 *
 * `VALIDATED_THEMES` is merged FIRST into the exported `THEMES` array.
 * ------------------------------------------------------------------------- */

import type { Theme } from './Theme';
import { ThemeStatus } from './Theme';
import type { TokenSet } from './Tokens';
import { validateTheme } from './validate';

/* ---------------------------------------------------------------------------
 * Lib DEFAULT token values — copied verbatim from `src/index.css`.
 *   - `LIB_DEFAULT_LIGHT` ← the `@theme { }` block
 *   - `LIB_DEFAULT_DARK`  ← the `.dark { }` block
 * A validated theme spreads these first, then applies its app-specific
 * overrides, so every token it doesn't define falls back to exactly the value
 * the real app inherits.
 * ------------------------------------------------------------------------- */

const LIB_DEFAULT_LIGHT: TokenSet = {
  background: '#ffffff',
  foreground: '#18181b',
  card: '#ffffff',
  'card-foreground': '#18181b',
  popover: '#ffffff',
  'popover-foreground': '#18181b',
  muted: '#f4f4f5',
  'muted-foreground': '#71717a',
  'subtle-foreground': '#a1a1aa',
  inverse: '#18181b',
  'inverse-foreground': '#fafafa',
  border: '#e4e4e7',
  'border-strong': '#d4d4d8',
  input: '#d4d4d8',
  ring: '#3b82f6',
  primary: '#2563eb',
  'primary-foreground': '#ffffff',
  'primary-soft': '#dbeafe',
  'primary-soft-foreground': '#1d4ed8',
  accent: '#0d9488',
  'accent-foreground': '#ffffff',
  'accent-soft': '#ccfbf1',
  'accent-soft-foreground': '#115e59',
  destructive: '#dc2626',
  'destructive-foreground': '#ffffff',
  'destructive-soft': '#fef2f2',
  'destructive-soft-foreground': '#b91c1c',
  info: '#0891b2',
  'info-foreground': '#ffffff',
  'info-soft': '#ecfeff',
  'info-soft-foreground': '#0e7490',
  success: '#16a34a',
  'success-foreground': '#ffffff',
  'success-soft': '#f0fdf4',
  'success-soft-foreground': '#15803d',
  warning: '#f59e0b',
  'warning-foreground': '#78350f',
  'warning-soft': '#fffbeb',
  'warning-soft-foreground': '#b45309',
};

const LIB_DEFAULT_DARK: TokenSet = {
  background: '#09090b',
  foreground: '#fafafa',
  card: '#18181b',
  'card-foreground': '#fafafa',
  popover: '#18181b',
  'popover-foreground': '#fafafa',
  muted: '#18181b',
  'muted-foreground': '#a1a1aa',
  'subtle-foreground': '#71717a',
  inverse: '#fafafa',
  'inverse-foreground': '#09090b',
  border: '#27272a',
  'border-strong': '#3f3f46',
  input: '#3f3f46',
  ring: '#60a5fa',
  primary: '#3b82f6',
  'primary-foreground': '#ffffff',
  'primary-soft': '#1e3a8a',
  'primary-soft-foreground': '#dbeafe',
  accent: '#2dd4bf',
  'accent-foreground': '#042f2e',
  'accent-soft': '#134e4a',
  'accent-soft-foreground': '#5eead4',
  destructive: '#ef4444',
  'destructive-foreground': '#ffffff',
  'destructive-soft': '#7f1d1d',
  'destructive-soft-foreground': '#fee2e2',
  info: '#06b6d4',
  'info-foreground': '#ffffff',
  'info-soft': '#164e63',
  'info-soft-foreground': '#cffafe',
  success: '#22c55e',
  'success-foreground': '#ffffff',
  'success-soft': '#14532d',
  'success-soft-foreground': '#dcfce7',
  warning: '#f59e0b',
  'warning-foreground': '#78350f',
  'warning-soft': '#78350f',
  'warning-soft-foreground': '#fef3c7',
};

/* ---------------------------------------------------------------------------
 * Smart QR — the real, visually-validated product theme.
 *
 * Hand-authored from the shipping Smart QR app: violet brand + teal accent on
 * cool lavender-grey (light) / charcoal (dark). The overrides below are the
 * EXACT app token hex values; everything else inherits the lib defaults above
 * (so the self-contained theme renders identically to the real app).
 *
 * Tokens filled from lib defaults (NOT app-defined — the app inherits them):
 *   light: card-foreground (= foreground), inverse, inverse-foreground,
 *          and the destructive / info / success / warning families.
 *   dark:  card-foreground (= foreground), inverse, inverse-foreground,
 *          primary-foreground, accent-foreground,
 *          and the destructive / info / success / warning families.
 * ------------------------------------------------------------------------- */

const smartQrLight: TokenSet = {
  ...LIB_DEFAULT_LIGHT,
  background: '#d9dde8',
  card: '#ebeef4',
  popover: '#ebeef4',
  'popover-foreground': '#1c1d26',
  muted: '#f1f2f8',
  foreground: '#1c1d26',
  'card-foreground': '#1c1d26', // = foreground (app inherits foreground here)
  'muted-foreground': '#6e7188',
  'subtle-foreground': '#9b9fb5',
  border: '#e4e6f0',
  'border-strong': '#c7cad9',
  input: '#e4e6f0',
  ring: '#8b5cf6',
  primary: '#7c3aed',
  'primary-foreground': '#f5f3ff',
  'primary-soft': '#ede9fe',
  'primary-soft-foreground': '#5b21b6',
  accent: '#0d9488',
  'accent-foreground': '#ffffff',
  'accent-soft': '#ccfbf1',
  'accent-soft-foreground': '#115e59',
};

const smartQrDark: TokenSet = {
  ...LIB_DEFAULT_DARK,
  background: '#121214',
  card: '#1c1c1f',
  popover: '#1c1c1f',
  'popover-foreground': '#e7e7e9',
  muted: '#18181b',
  foreground: '#e7e7e9',
  'card-foreground': '#e7e7e9', // = foreground (app inherits foreground here)
  'muted-foreground': '#a1a1aa',
  'subtle-foreground': '#6e6e76',
  border: '#2a2a2e',
  'border-strong': '#3a3a40',
  input: '#2a2a2e',
  ring: '#8b5cf6',
  primary: '#8b5cf6',
  'primary-soft': '#2a2440',
  'primary-soft-foreground': '#c4b5fd',
  accent: '#2dd4bf',
  'accent-soft': '#103a35',
  'accent-soft-foreground': '#5eead4',
};

/** Smart QR — the first validated, real-app-proven theme. Colors are locked. */
const smartQr: Theme = {
  id: 'smart-qr',
  name: 'Smart QR',
  description:
    'Violet brand + teal accent on cool lavender-grey (light) / charcoal (dark) — the validated Smart QR product theme.',
  tags: ['brand', 'violet', 'teal', 'validated', 'product'],
  light: smartQrLight,
  dark: smartQrDark,
  status: ThemeStatus.Validated,
  // Recorded for transparency. We do NOT auto-nudge any value — status stays
  // `validated` even if a pair fails (the human validated it visually).
  meta: validateTheme({ light: smartQrLight, dark: smartQrDark }),
};

/** Validated themes, merged FIRST into the curated `THEMES` array. */
export const VALIDATED_THEMES: Theme[] = [smartQr];
