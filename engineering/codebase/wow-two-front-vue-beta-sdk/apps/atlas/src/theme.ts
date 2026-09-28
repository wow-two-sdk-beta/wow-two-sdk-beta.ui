import { ref, watch } from 'vue';
import { ThemeCatalog, getTheme, themeToCss } from '@wow-two-beta/ui-vue/foundation/themes';

/** The atlas opens on the house theme; any catalog theme can be applied from the top bar or the themes page. */
export const DEFAULT_THEME = 'wow';
const STYLE_ID = 'atlas-theme';
export const themes = ThemeCatalog;
const ids = new Set(themes.map((theme) => theme.id));

function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function savePreference(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage can be unavailable in embedded previews. */
  }
}

const storedTheme = readPreference('atlas:theme');
export const themeId = ref(storedTheme !== null && ids.has(storedTheme) ? storedTheme : DEFAULT_THEME);
export const isDark = ref(readPreference('atlas:dark') === 'true');

/** Emits only the selected theme's CSS and keeps the root classes in step; returns a disposer. */
export function installTheme(): () => void {
  const style = document.getElementById(STYLE_ID) ?? document.createElement('style');
  style.id = STYLE_ID;
  if (!style.isConnected) document.head.append(style);
  const stopTheme = watch(
    themeId,
    (id) => {
      const theme = ids.has(id) ? getTheme(id) : undefined;
      if (!theme) {
        themeId.value = DEFAULT_THEME;
        return;
      }
      style.textContent = themeToCss(theme);
      const root = document.documentElement;
      for (const value of [...root.classList]) {
        if (value.startsWith('theme-')) root.classList.remove(value);
      }
      root.classList.add(`theme-${id}`);
      savePreference('atlas:theme', id);
    },
    { immediate: true, flush: 'sync' },
  );
  const stopDark = watch(
    isDark,
    (dark) => {
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      savePreference('atlas:dark', String(dark));
    },
    { immediate: true, flush: 'sync' },
  );
  return () => {
    stopTheme();
    stopDark();
    style.remove();
  };
}
