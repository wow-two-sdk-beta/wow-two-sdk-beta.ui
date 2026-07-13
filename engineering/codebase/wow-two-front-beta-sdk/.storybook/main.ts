import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const config: StorybookConfig = {
  stories: ['../tests/stories/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    'storybook-addon-pseudo-states',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
  ],
  framework: { name: '@storybook/react-vite', options: {} },
  typescript: { reactDocgen: 'react-docgen-typescript' },
  viteFinal: async (cfg) =>
    mergeConfig(cfg, {
      plugins: [tailwindcss()],
      // Stories live under `../tests/stories/` and import source via `@src/*`.
      resolve: { alias: { '@src': fileURLToPath(new URL('../src', import.meta.url)) } },
      // Pre-bundle deps discovered only at story runtime (the forms-engine recipes wire
      // router + query STORY-side; jsx-dev-runtime surfaces on a fully cold cache) —
      // mid-run discovery re-optimizes and reloads, which duplicates React / aborts
      // renders and fails the whole vitest storybook project on first run (cold CI).
      optimizeDeps: {
        include: ['react/jsx-dev-runtime', 'react-router-dom', '@tanstack/react-query'],
      },
    }),
};

export default config;
