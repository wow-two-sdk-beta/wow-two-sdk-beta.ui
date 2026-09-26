/* ---------------------------------------------------------------------------
 * Authored themes — hand-authored palettes from Wheelhouse's design directions.
 *
 * Like `validated.ts`, the colors are AUTHORED VERBATIM and never re-derived
 * (running them through `generateTheme` would AA-nudge them), but no shipping
 * app has proven them yet, so they stay `candidate`. Each clears AA in both
 * modes. Where a direction was drawn in one mode, the other mode is its
 * counterpart in the same hues.
 *
 * The glass directions carry an `ambient` backdrop: the colored light their
 * translucent surfaces blur. An app paints it with `surface-ambient` and puts
 * its panels on the `glass` surface variant.
 *
 * `AUTHORED_THEMES` is merged right after `VALIDATED_THEMES` into `THEMES`.
 * ------------------------------------------------------------------------- */

import type { Theme, ThemeAmbient } from './Theme';
import { ThemeRadius, ThemeStatus } from './Theme';
import type { TokenSet } from './Tokens';
import { validateTheme } from './validate';

/* ---------------------------------------------------------------------------
 * Glass Harbor — cyan brand and amber harbor lights on deep navy, under dark glass.
 * Dark is the drawn direction; light is its pale sea-glass daybreak.
 * ------------------------------------------------------------------------- */

const glassHarborLight: TokenSet = {
  background: '#eaf2f6',
  foreground: '#0b1f33',
  card: '#f7fbfc',
  'card-foreground': '#0b1f33',
  popover: '#ffffff',
  'popover-foreground': '#0b1f33',
  muted: '#dde8ee',
  'muted-foreground': '#4a6075',
  'subtle-foreground': '#71879b',
  inverse: '#0b1f33',
  'inverse-foreground': '#eaf2f6',
  border: '#d2dfe7',
  'border-strong': '#b7c9d5',
  input: '#c5d6e0',
  ring: '#1b7f9e',
  primary: '#17718e',
  'primary-foreground': '#ffffff',
  'primary-soft': '#d6ecf3',
  'primary-soft-foreground': '#125a72',
  accent: '#5a48d6',
  'accent-foreground': '#ffffff',
  'accent-soft': '#e6e3fb',
  'accent-soft-foreground': '#3f2fb0',
  destructive: '#c0364c',
  'destructive-foreground': '#ffffff',
  'destructive-soft': '#fbe3e7',
  'destructive-soft-foreground': '#9b2438',
  info: '#1f68b0',
  'info-foreground': '#ffffff',
  'info-soft': '#dfeaf7',
  'info-soft-foreground': '#1a538c',
  success: '#1b7a5f',
  'success-foreground': '#ffffff',
  'success-soft': '#dcf2ea',
  'success-soft-foreground': '#155c48',
  warning: '#d9892f',
  'warning-foreground': '#2e1804',
  'warning-soft': '#fcebd9',
  'warning-soft-foreground': '#8a4b0f',
};

const glassHarborDark: TokenSet = {
  background: '#06121f',
  foreground: '#e8f1f8',
  card: '#0f2133',
  'card-foreground': '#e8f1f8',
  popover: '#13283f',
  'popover-foreground': '#e8f1f8',
  muted: '#0b1b2c',
  'muted-foreground': '#9fb4c8',
  'subtle-foreground': '#6d86a0',
  inverse: '#e8f1f8',
  'inverse-foreground': '#06121f',
  border: '#20364d',
  'border-strong': '#2f4b68',
  input: '#294460',
  ring: '#5fd3e6',
  primary: '#4fb0cf',
  'primary-foreground': '#041722',
  'primary-soft': '#0e3346',
  'primary-soft-foreground': '#8fe3f2',
  accent: '#a497ff',
  'accent-foreground': '#140e3a',
  'accent-soft': '#231f4d',
  'accent-soft-foreground': '#c9c1ff',
  destructive: '#ff8a9a',
  'destructive-foreground': '#2a0a10',
  'destructive-soft': '#3a1622',
  'destructive-soft-foreground': '#ffb8c2',
  info: '#7cc4fa',
  'info-foreground': '#04182a',
  'info-soft': '#0f2c45',
  'info-soft-foreground': '#a9dcff',
  success: '#5fd3a8',
  'success-foreground': '#03241a',
  'success-soft': '#0f3329',
  'success-soft-foreground': '#8ff0c8',
  warning: '#f4a259',
  'warning-foreground': '#2e1804',
  'warning-soft': '#3a2616',
  'warning-soft-foreground': '#ffc58f',
};

const glassHarborAmbient: ThemeAmbient = {
  light: [
    'radial-gradient(circle at 62% 8%, rgb(95 196 222 / 0.34), transparent 38%)',
    'radial-gradient(circle at 10% 81%, rgb(150 140 235 / 0.24), transparent 34%)',
    'radial-gradient(circle at 96% 86%, rgb(255 190 130 / 0.3), transparent 24%)',
  ].join(', '),
  dark: [
    'radial-gradient(circle at 62% 8%, rgb(27 143 166 / 0.38), transparent 38%)',
    'radial-gradient(circle at 10% 81%, rgb(74 63 196 / 0.3), transparent 34%)',
    'radial-gradient(circle at 96% 86%, rgb(244 162 89 / 0.16), transparent 22%)',
  ].join(', '),
};

/** Glass Harbor — dark glass over a navy harbor glow. */
const glassHarbor: Theme = {
  id: 'glass-harbor',
  name: 'Glass Harbor',
  description:
    'Cyan brand and amber harbor lights on deep navy under dark glass; light mode is its pale sea-glass counterpart.',
  tags: ['authored', 'glass', 'cool', 'navy', 'cyan'],
  light: glassHarborLight,
  dark: glassHarborDark,
  radius: ThemeRadius.Lg,
  ambient: glassHarborAmbient,
  status: ThemeStatus.Candidate,
  meta: validateTheme({ light: glassHarborLight, dark: glassHarborDark }),
};

/* ---------------------------------------------------------------------------
 * Frost — deep teal brand on a blue, lavender and peach wash, under frosted glass.
 * Light is the drawn direction; dark is its cool slate night.
 * ------------------------------------------------------------------------- */

const frostLight: TokenSet = {
  background: '#eef3f8',
  foreground: '#15233a',
  card: '#f8fafd',
  'card-foreground': '#15233a',
  popover: '#ffffff',
  'popover-foreground': '#15233a',
  muted: '#e3e9f0',
  'muted-foreground': '#4d5d74',
  'subtle-foreground': '#7b889c',
  inverse: '#15233a',
  'inverse-foreground': '#f4f7fb',
  border: '#dbe3ec',
  'border-strong': '#c3cedb',
  input: '#d0d9e4',
  ring: '#1f6f8b',
  primary: '#1f6f8b',
  'primary-foreground': '#ffffff',
  'primary-soft': '#dcebf1',
  'primary-soft-foreground': '#185a71',
  accent: '#6252d8',
  'accent-foreground': '#ffffff',
  'accent-soft': '#ebe8fb',
  'accent-soft-foreground': '#4838b8',
  destructive: '#c23349',
  'destructive-foreground': '#ffffff',
  'destructive-soft': '#fbe4e7',
  'destructive-soft-foreground': '#9e2b3b',
  info: '#2a67ad',
  'info-foreground': '#ffffff',
  'info-soft': '#e1ecf8',
  'info-soft-foreground': '#1f5390',
  success: '#1d7a6e',
  'success-foreground': '#ffffff',
  'success-soft': '#dff3ef',
  'success-soft-foreground': '#1c6e64',
  warning: '#e9a23b',
  'warning-foreground': '#3d2503',
  'warning-soft': '#fdebd7',
  'warning-soft-foreground': '#8a4b0f',
};

const frostDark: TokenSet = {
  background: '#10131d',
  foreground: '#eef1f8',
  card: '#1a1e2b',
  'card-foreground': '#eef1f8',
  popover: '#202536',
  'popover-foreground': '#eef1f8',
  muted: '#161a26',
  'muted-foreground': '#a3adc2',
  'subtle-foreground': '#737e95',
  inverse: '#eef1f8',
  'inverse-foreground': '#10131d',
  border: '#2a3042',
  'border-strong': '#3a4258',
  input: '#333a4f',
  ring: '#7cc7de',
  primary: '#7cc7de',
  'primary-foreground': '#06202b',
  'primary-soft': '#16303b',
  'primary-soft-foreground': '#a8e0f0',
  accent: '#a99cf5',
  'accent-foreground': '#16103a',
  'accent-soft': '#262245',
  'accent-soft-foreground': '#cdc5fb',
  destructive: '#f28b9b',
  'destructive-foreground': '#2a0a10',
  'destructive-soft': '#3a1821',
  'destructive-soft-foreground': '#ffb8c2',
  info: '#86b6f0',
  'info-foreground': '#071a33',
  'info-soft': '#17263d',
  'info-soft-foreground': '#b3d1f7',
  success: '#6fd4bf',
  'success-foreground': '#04241f',
  'success-soft': '#13302b',
  'success-soft-foreground': '#9fe7d7',
  warning: '#f2b766',
  'warning-foreground': '#2e1c04',
  'warning-soft': '#3a2b17',
  'warning-soft-foreground': '#f8d3a0',
};

const frostAmbient: ThemeAmbient = {
  light: [
    'radial-gradient(circle at 14% 11%, rgb(159 214 234 / 0.55), transparent 32%)',
    'radial-gradient(circle at 56% 47%, rgb(201 193 245 / 0.45), transparent 30%)',
    'radial-gradient(circle at 88% 78%, rgb(255 201 163 / 0.55), transparent 32%)',
    'linear-gradient(160deg, #e7f1fa 0%, #f3f0f8 55%, #fbf1e7 100%)',
  ].join(', '),
  dark: [
    'radial-gradient(circle at 14% 11%, rgb(56 120 150 / 0.3), transparent 34%)',
    'radial-gradient(circle at 56% 47%, rgb(98 82 216 / 0.16), transparent 32%)',
    'radial-gradient(circle at 88% 78%, rgb(214 132 84 / 0.14), transparent 32%)',
    'linear-gradient(160deg, #111827 0%, #12131f 55%, #17131a 100%)',
  ].join(', '),
};

/** Frost — light frosted glass over a pastel wash. */
const frost: Theme = {
  id: 'frost',
  name: 'Frost',
  description:
    'Deep teal brand on a blue, lavender and peach wash under frosted glass; dark mode is its cool slate night.',
  tags: ['authored', 'glass', 'light', 'teal', 'pastel'],
  light: frostLight,
  dark: frostDark,
  radius: ThemeRadius.Lg,
  ambient: frostAmbient,
  status: ThemeStatus.Candidate,
  meta: validateTheme({ light: frostLight, dark: frostDark }),
};

/* ---------------------------------------------------------------------------
 * Bento Deck — teal brand and pastel tone tiles on warm paper, with ink surfaces.
 * Flat by design: solid tiles, no glass, so no ambient backdrop.
 * ------------------------------------------------------------------------- */

const bentoDeckLight: TokenSet = {
  background: '#f1eee8',
  foreground: '#1b1f2a',
  card: '#ffffff',
  'card-foreground': '#1b1f2a',
  popover: '#ffffff',
  'popover-foreground': '#1b1f2a',
  muted: '#e9e4da',
  'muted-foreground': '#545a6b',
  'subtle-foreground': '#7f838e',
  inverse: '#1b1f2a',
  'inverse-foreground': '#f4f1ea',
  border: '#e2ddd2',
  'border-strong': '#cfc8bb',
  input: '#d9d4ca',
  ring: '#1f5f7a',
  primary: '#1f5f7a',
  'primary-foreground': '#ffffff',
  'primary-soft': '#dcebf0',
  'primary-soft-foreground': '#1b5068',
  accent: '#6b55a8',
  'accent-foreground': '#ffffff',
  'accent-soft': '#ebe4f5',
  'accent-soft-foreground': '#4a3a6b',
  destructive: '#c4413c',
  'destructive-foreground': '#ffffff',
  'destructive-soft': '#f8e1df',
  'destructive-soft-foreground': '#8f2d29',
  info: '#2e6aa6',
  'info-foreground': '#ffffff',
  'info-soft': '#e3ecf7',
  'info-soft-foreground': '#2e4a6b',
  success: '#2d7f63',
  'success-foreground': '#ffffff',
  'success-soft': '#dff0ea',
  'success-soft-foreground': '#2d5a4e',
  warning: '#e0a24a',
  'warning-foreground': '#3a2508',
  'warning-soft': '#f6e5d3',
  'warning-soft-foreground': '#6b4520',
};

const bentoDeckDark: TokenSet = {
  background: '#14161c',
  foreground: '#f1eee8',
  card: '#1d2029',
  'card-foreground': '#f1eee8',
  popover: '#232733',
  'popover-foreground': '#f1eee8',
  muted: '#262a34',
  'muted-foreground': '#a9adb9',
  'subtle-foreground': '#7b808d',
  inverse: '#f1eee8',
  'inverse-foreground': '#14161c',
  border: '#2b2f3a',
  'border-strong': '#3b404d',
  input: '#353a46',
  ring: '#7fbfd8',
  primary: '#7fbfd8',
  'primary-foreground': '#0a2330',
  'primary-soft': '#18303b',
  'primary-soft-foreground': '#a9d8ea',
  accent: '#b3a1ea',
  'accent-foreground': '#1d1438',
  'accent-soft': '#2a2340',
  'accent-soft-foreground': '#d3c7f5',
  destructive: '#f08a84',
  'destructive-foreground': '#2b0b09',
  'destructive-soft': '#3a1b1a',
  'destructive-soft-foreground': '#f9bdb8',
  info: '#8fb8e8',
  'info-foreground': '#0b1b30',
  'info-soft': '#1b2a3e',
  'info-soft-foreground': '#bcd4f2',
  success: '#7fd3b2',
  'success-foreground': '#06261b',
  'success-soft': '#173129',
  'success-soft-foreground': '#a6e5cc',
  warning: '#f0c07a',
  'warning-foreground': '#2e1f07',
  'warning-soft': '#35291a',
  'warning-soft-foreground': '#f5d3a3',
};

/** Bento Deck — flat pastel tiles on warm paper. */
const bentoDeck: Theme = {
  id: 'bento-deck',
  name: 'Bento Deck',
  description:
    'Teal brand and pastel tone tiles on warm paper with ink surfaces; flat, no glass; dark mode is warm charcoal.',
  tags: ['authored', 'warm', 'paper', 'pastel', 'flat'],
  light: bentoDeckLight,
  dark: bentoDeckDark,
  radius: ThemeRadius.Lg,
  status: ThemeStatus.Candidate,
  meta: validateTheme({ light: bentoDeckLight, dark: bentoDeckDark }),
};

/* ---------------------------------------------------------------------------
 * Harbor Frost — the merged direction: Frost by day, Glass Harbor by night.
 * Both modes reuse the sets above, so a fix to either direction lands here too.
 * ------------------------------------------------------------------------- */

/** Harbor Frost — Frost's light glass paired with Glass Harbor's dark glass. */
const harborFrost: Theme = {
  id: 'harbor-frost',
  name: 'Harbor Frost',
  description: "Frost's light glass by day and Glass Harbor's dark glass by night; the merged Wheelhouse direction.",
  tags: ['authored', 'glass', 'merged', 'teal', 'navy'],
  light: frostLight,
  dark: glassHarborDark,
  radius: ThemeRadius.Lg,
  ambient: { light: frostAmbient.light, dark: glassHarborAmbient.dark },
  status: ThemeStatus.Candidate,
  meta: validateTheme({ light: frostLight, dark: glassHarborDark }),
};

/** Authored themes, merged after the validated ones and before the generated candidates. */
export const AUTHORED_THEMES: ReadonlyArray<Theme> = [glassHarbor, frost, bentoDeck, harborFrost];
