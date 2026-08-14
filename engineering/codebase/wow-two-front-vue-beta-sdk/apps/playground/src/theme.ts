import { ref, watchEffect } from 'vue';
import { THEMES, emitAllThemesCss } from '@wow-two-beta/ui-vue/foundation/themes';

/** The one `validated` theme — the pilot app's, and the gallery's default. */
export const DEFAULT_THEME = 'smart-qr';

const STYLE_ID = 'wow-two-themes';

/**
 * Injects the full `.theme-{id}` / `.dark.theme-{id}` stylesheet into the page.
 *
 * `pnpm build` writes this same CSS to `dist/themes.css` via
 * `scripts/build-themes-css.mjs`. The gallery aliases the lib to SOURCE, so
 * there is no `dist/` in the loop — emit it at boot from the live registry
 * instead, which keeps a theme edit one save away from being visible.
 */
export function installThemesCss(): void {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = emitAllThemesCss(THEMES);
  document.head.append(style);
}

/** Holds every curated theme, `validated` first (the registry's own order). */
export const themes = THEMES;

export const themeId = ref(localStorage.getItem('pg:theme') ?? DEFAULT_THEME);
export const isDark = ref(localStorage.getItem('pg:dark') === 'true');

/* The theme class + `dark` go on <html> so portalled content (modals, popovers,
   toasts — everything that escapes the app root into document.body) inherits
   the tokens too. Putting them on a wrapper div is the classic way to get a
   correctly themed page with unthemed overlays. */
watchEffect(() => {
  const root = document.documentElement;
  root.classList.forEach((c) => {
    if (c.startsWith('theme-')) root.classList.remove(c);
  });
  root.classList.add(`theme-${themeId.value}`);
  root.classList.toggle('dark', isDark.value);
  root.style.colorScheme = isDark.value ? 'dark' : 'light';
  localStorage.setItem('pg:theme', themeId.value);
  localStorage.setItem('pg:dark', String(isDark.value));
});
