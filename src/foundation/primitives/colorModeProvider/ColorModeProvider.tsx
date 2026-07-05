import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ColorMode = 'light' | 'dark';

interface ColorModeContextValue {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  toggle: () => void;
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

const systemMode = (): ColorMode =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export interface ColorModeProviderProps {
  children: ReactNode;
  /** Mode used when nothing is persisted. `'system'` follows the OS preference. Default `'system'`. */
  defaultMode?: ColorMode | 'system';
  /** `localStorage` key for persistence; pass `null` to disable. Default `'wow-color-mode'`. */
  storageKey?: string | null;
}

/**
 * Owns the app's light/dark mode: toggles the `dark` class on `<html>` (which flips every semantic
 * token) + sets `color-scheme`, persists the choice, and falls back to the OS preference. Wrap the
 * app once; read via `useColorMode()`. This is the canonical `.dark` mechanism for the design tokens.
 */
export function ColorModeProvider({
  children,
  defaultMode = 'system',
  storageKey = 'wow-color-mode',
}: ColorModeProviderProps) {
  const [mode, setModeState] = useState<ColorMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = storageKey ? (localStorage.getItem(storageKey) as ColorMode | null) : null;
    if (stored === 'light' || stored === 'dark') return stored;
    return defaultMode === 'system' ? systemMode() : defaultMode;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode;
  }, [mode]);

  const setMode = useCallback(
    (next: ColorMode) => {
      setModeState(next);
      if (storageKey) localStorage.setItem(storageKey, next);
    },
    [storageKey],
  );

  const value = useMemo<ColorModeContextValue>(
    () => ({ mode, setMode, toggle: () => setMode(mode === 'dark' ? 'light' : 'dark') }),
    [mode, setMode],
  );

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}

export function useColorMode(): ColorModeContextValue {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within a <ColorModeProvider>.');
  return ctx;
}
