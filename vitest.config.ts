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
          // Suffix convention: `*.browser.test.ts` = needs a real DOM → browser
          // project; plain `*.test.ts` in these layers = pure logic → here.
          include: [
            'src/foundation/{utils,themes,http,storage,resilience}/**/*.test.ts',
            'src/domain/**/*.test.ts',
            'src/{router,query,auth}/**/*.test.ts',
          ],
          exclude: ['**/*.browser.test.ts'],
        },
      },
      {
        test: {
          name: 'browser',
          include: [
            'src/**/*.test.tsx',
            'src/foundation/hooks/**/*.test.ts',
            'src/**/*.browser.test.ts',
          ],
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
