import type { ReactNode } from 'react';
import { cn } from '@wow-two-beta/ui/utils';

interface ThemePreviewScopeProps {
  /** Theme id to scope this subtree to (applies `theme-{id}`). */
  themeId: string;
  /** Render this subtree in dark mode (adds `.dark`, re-resolving to the theme's dark block). */
  isDark?: boolean;
  className?: string;
  /** Hide a purely decorative preview subtree from assistive tech. */
  'aria-hidden'?: boolean;
  children: ReactNode;
}

/* Locally scopes a subtree to a given theme + mode without touching the app
   root — used by gallery cards (each previews its own theme) and the preview
   board's side-by-side light/dark panels. The lib's dark variant is
   `&:where(.dark, .dark *)`, and themes.css emits `.dark.theme-{id}` for dark
   values, so `theme-{id} dark` on one element re-resolves every token utility
   inside it. Portaled UI is NOT covered here (it escapes to <body>); that's why
   the app root + body mirror still drive the *active* theme globally. */
export function ThemePreviewScope({
  themeId,
  isDark = false,
  className,
  'aria-hidden': ariaHidden,
  children,
}: ThemePreviewScopeProps) {
  return (
    <div
      aria-hidden={ariaHidden}
      className={cn(`theme-${themeId}`, isDark && 'dark', 'bg-background text-foreground', className)}
    >
      {children}
    </div>
  );
}
