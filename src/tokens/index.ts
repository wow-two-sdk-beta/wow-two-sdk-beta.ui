// Default token set — extend as components require it.
// Consumed by `src/tailwind/preset.ts` and exposed as raw values to consumers
// who want them outside Tailwind (CSS-in-JS, inline styles, etc.).

export const colors = {
  brand: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    500: '#71717a',
    700: '#3f3f46',
    900: '#18181b',
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export const radius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px',
} as const;

export const tokens = { colors, spacing, radius } as const;
export type Tokens = typeof tokens;
