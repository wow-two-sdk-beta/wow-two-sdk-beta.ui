import type { Config } from 'tailwindcss';
import {
  breakpoints,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  opacity,
  radius,
  shadow,
  spacing,
} from '../tokens';

export const wowTwoPreset: Partial<Config> = {
  theme: {
    screens: { ...breakpoints },
    extend: {
      colors,
      spacing,
      borderRadius: radius,
      fontFamily: fontFamily as unknown as Record<string, string[]>,
      fontSize: fontSize as unknown as Record<string, [string, { lineHeight: string }]>,
      fontWeight,
      boxShadow: shadow,
      opacity,
    },
  },
};
