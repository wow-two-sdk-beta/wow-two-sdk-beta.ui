import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';

// Tests live under `tests/` (source-only `src/`); they reach back into source via the
// `@src/*` alias (mirrors the `tsconfig.json` path). Applied per project so every project
// (unit · browser) resolves it.
const srcAlias = { '@src': fileURLToPath(new URL('./src', import.meta.url)) };

/*
 * Two projects (the React package's third — `storybook` — has no Vue counterpart yet):
 *  - unit    — node, pure logic (foundation utils/themes/http + domain)
 *  - browser — real chromium, composables + component tests via @vue/test-utils
 *
 * Suffix convention, carried over from the React package:
 *   `*.browser.test.ts` = needs a real DOM → browser project
 *   plain `*.test.ts` in the logic layers = pure logic → unit project
 *   `*.test.vue.ts` / any test mounting an SFC → browser project
 */
export default defineConfig({
  resolve: { alias: srcAlias },
  test: {
    // Scaffold-only: `src/` is still being populated layer by layer, so `pnpm test` would
    // otherwise fail on "no test files". Drop this once the first tests land.
    passWithNoTests: true,
    projects: [
      {
        plugins: [vue()],
        resolve: { alias: srcAlias },
        test: {
          name: 'unit',
          environment: 'node',
          include: [
            'tests/unit/foundation/{utils,themes,http,storage,resilience,identifiers,i18n,config,shortcuts,format,files,commands,errors,share,logger,device,notifications,uploads,gestures,selection,media,animation,virtualization,observers,crypto,sync,idb,workers,screen,geolocation,async,undo,clipboard,speech,collections,datetime,validation,net}/**/*.test.ts',
            'tests/unit/domain/**/*.test.ts',
            'tests/unit/{router,query,auth,feedback,forms-engine,analytics,flags}/**/*.test.ts',
          ],
          exclude: ['**/*.browser.test.ts', '**/*.component.test.ts'],
        },
      },
      {
        plugins: [vue(), tailwindcss()],
        resolve: { alias: srcAlias },
        test: {
          name: 'browser',
          include: [
            'tests/unit/**/*.component.test.ts',
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
    ],
  },
});
