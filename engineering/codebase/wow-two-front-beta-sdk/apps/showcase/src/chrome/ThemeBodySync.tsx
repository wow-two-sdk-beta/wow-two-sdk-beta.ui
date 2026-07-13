import { useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';

/* Mirrors the theme classes onto <body>. Portaled UI (Toaster, Dialog /
   CommandPalette, the AppShell sidebar Drawer) renders into document.body —
   outside the ThemeProvider div — so without this it would ignore the
   dark / haven token overrides. */
export function ThemeBodySync() {
  const { dark, haven } = useTheme();

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    document.body.classList.toggle('theme-haven', haven);
    return () => {
      document.body.classList.remove('dark', 'theme-haven');
    };
  }, [dark, haven]);

  return null;
}
