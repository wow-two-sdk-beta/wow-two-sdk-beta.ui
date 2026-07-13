import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { fileURLToPath } from 'node:url';

// Tests + stories live under `tests/` (source-only `src/`); they reach back into
// source via the `@src/*` alias (mirrors the `tsconfig.json` path). Applied per
// project so every project (unit · browser · storybook) resolves it.
const srcAlias = { '@src': fileURLToPath(new URL('./src', import.meta.url)) };

/*
 * Three projects (engineering/architecture/testing.md):
 *  - unit      — node, pure logic (foundation utils/themes/http + domain)
 *  - browser   — real chromium, hooks + bespoke component tests
 *  - storybook — every story = render-smoke test; play() = interaction test
 */
export default defineConfig({
  resolve: { alias: srcAlias },
  test: {
    projects: [
      {
        resolve: { alias: srcAlias },
        test: {
          name: 'unit',
          environment: 'node',
          // Suffix convention: `*.browser.test.ts` = needs a real DOM → browser
          // project; plain `*.test.ts` in these layers = pure logic → here.
          include: [
            'tests/unit/foundation/{utils,themes,http,storage,resilience,identifiers,i18n,config}/**/*.test.ts',
            'tests/unit/domain/**/*.test.ts',
            'tests/unit/{router,query,auth,feedback,forms-engine}/**/*.test.ts',
          ],
          exclude: ['**/*.browser.test.ts'],
        },
      },
      {
        resolve: { alias: srcAlias },
        test: {
          name: 'browser',
          include: [
            'tests/unit/**/*.test.tsx',
            'tests/unit/foundation/hooks/**/*.test.ts',
            'tests/unit/**/*.browser.test.ts',
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
        resolve: { alias: srcAlias },
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
