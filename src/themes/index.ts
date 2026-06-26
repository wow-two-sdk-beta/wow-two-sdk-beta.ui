/* ---------------------------------------------------------------------------
 * @wow-two-beta/ui — themes (foundation module).
 *
 * A theme ENGINE: derive proven light/dark token sets from an OKLCH seed, apply
 * a curated theme by name, validate any theme for WCAG AA, and emit the scoped
 * CSS / JSON manifest an app (or Claude) uses to "use theme X".
 *
 * Import: `import { THEMES, getTheme, generateTheme } from '@wow-two-beta/ui/themes'`
 * Apply : add `theme-{id}` to a root element; toggle `.dark` for dark mode.
 *         The matching stylesheet ships at `@wow-two-beta/ui/themes.css`.
 *
 * Foundation layer — no upward imports (ESLint enforces).
 * ------------------------------------------------------------------------- */

// Color engine
export { Oklch } from './Oklch';
export type { Oklch as OklchColor } from './Oklch';
export {
  normalizeHue,
  isInSrgbGamut,
  clampChromaToGamut,
  oklchToHex,
  oklchToCss,
  parseColor,
  relativeLuminance,
  contrastRatio,
  contrastRatioCss,
} from './Oklch';

// Token contract
export type {
  SemanticToken,
  TokenSet,
  RadiusScale,
  ToneFamilyName,
  ToneSlots,
} from './Tokens';
export {
  SEMANTIC_TOKENS,
  SURFACE_TOKENS,
  TONE_FAMILIES,
  applyToneSlots,
} from './Tokens';

// Theme + seed shapes
export type {
  Theme,
  ThemeMeta,
  ThemeSeed,
  NeutralTemp,
  AccentMode,
  SurfaceStyle,
} from './Theme';
// ThemeStatus is a const-object enum + a type of the same name (value + type export).
export { ThemeStatus } from './Theme';

// Generator
export { generateTheme } from './generate';

// Validator
export { validateTheme, contrastPairs, AA_TEXT, AA_UI } from './validate';

// CSS / manifest emitters
export {
  themeToCss,
  emitAllThemesCss,
  emitThemesManifest,
  type ThemeManifestEntry,
} from './css';

// Curated registry
export {
  THEMES,
  THEME_SEEDS,
  THEME_IDS,
  getTheme,
  validatedThemes,
  candidateThemes,
} from './registry';
