import type { Config } from 'tailwindcss';
import { colors, radius, spacing } from '../tokens';

export const wowTwoPreset: Partial<Config> = {
  theme: {
    extend: {
      colors,
      spacing,
      borderRadius: radius,
    },
  },
};
