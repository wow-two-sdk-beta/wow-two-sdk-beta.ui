import { createContext, useContext, useState, type ReactNode } from 'react';

interface ThemeContextValue {
  dark: boolean;
  haven: boolean;
  setDark: (next: boolean) => void;
  setHaven: (next: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/* Applies `dark` / `theme-haven` classes on the root div — same mechanism as
   `@custom-variant dark (&:where(.dark, .dark *))` in the lib's index.css and
   the playground's haven token override. No <html> mutation needed. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [haven, setHaven] = useState(false);

  return (
    <ThemeContext.Provider value={{ dark, haven, setDark, setHaven }}>
      <div
        className={[
          dark && 'dark',
          haven && 'theme-haven',
          'min-h-svh bg-background text-foreground',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
