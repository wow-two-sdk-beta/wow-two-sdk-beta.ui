import type { Config } from 'tailwindcss';
import { wowTwoPreset } from './src/tailwind/preset';

export default {
  content: [
    './src/**/*.{ts,tsx}',
    './apps/playground/src/**/*.{ts,tsx}',
    './.storybook/**/*.{ts,tsx}',
  ],
  presets: [wowTwoPreset],
} satisfies Config;
