import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

/*
 * Three projects (docs/testing.md):
 *  - unit      — node, pure logic (foundation utils/themes/http + domain)
 *  - browser   — real chromium, hooks + bespoke component tests
 *  - storybook — every story = render-smoke test; play() = interaction test
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: [
            'src/foundation/{utils,themes,http,storage}/**/*.test.ts',
            'src/domain/**/*.test.ts',
          ],
        },
      },
      {
        test: {
          name: 'browser',
          include: ['src/**/*.test.tsx', 'src/foundation/hooks/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        plugins: [storybookTest({ configDir: '.storybook' })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
