import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { THEMES, type Theme } from '@wow-two-beta/ui/themes';

interface ThemeStudioContextValue {
  /** Id of the active theme (drives the `theme-{id}` class). */
  themeId: string;
  /** Resolved active theme object. */
  theme: Theme;
  /** Whether dark mode is on app-wide. */
  dark: boolean;
  setThemeId: (id: string) => void;
  setDark: (next: boolean) => void;
}

const ThemeStudioContext = createContext<ThemeStudioContextValue | null>(null);

export function useThemeStudio(): ThemeStudioContextValue {
  const ctx = useContext(ThemeStudioContext);
  if (!ctx) throw new Error('useThemeStudio must be used within ThemeStudioProvider');
  return ctx;
}

const DEFAULT_THEME_ID = THEMES[0]?.id ?? 'wow';

/* Applies `theme-{id}` (+ `dark`) on a root wrapper div AND mirrors both classes
   onto <body> — portaled UI (Toaster, Dialog, Select popovers) renders into
   document.body, outside this div, so without the mirror it would ignore the
   theme's --color-* overrides. Same approach as showcase's ThemeBodySync,
   generalized to any theme id. */
export function ThemeStudioProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [dark, setDark] = useState(false);

  const theme = useMemo(
    () => THEMES.find((t) => t.id === themeId) ?? THEMES[0]!,
    [themeId],
  );

  useEffect(() => {
    const themeClass = `theme-${themeId}`;
    document.body.classList.add(themeClass);
    document.body.classList.toggle('dark', dark);
    return () => {
      document.body.classList.remove(themeClass);
    };
  }, [themeId, dark]);

  const value = useMemo(
    () => ({ themeId, theme, dark, setThemeId, setDark }),
    [themeId, theme, dark],
  );

  return (
    <ThemeStudioContext.Provider value={value}>
      <div
        className={[`theme-${themeId}`, dark && 'dark', 'min-h-svh bg-background text-foreground']
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </ThemeStudioContext.Provider>
  );
}
