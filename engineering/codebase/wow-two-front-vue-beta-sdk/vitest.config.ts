import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';

// Tests live under `tests/` (source-only `src/`); they reach back into source via the
// `@src/*` alias (mirrors the `tsconfig.json` path). Applied per project so every project
// (unit · ssr · dom · browser) resolves it.
const srcAlias = { '@src': fileURLToPath(new URL('./src', import.meta.url)) };

/* The two suffixes the smoke layer routes on, excluded from every project that is not theirs. */
const smokeSuffixes = ['**/*.ssr.test.ts', '**/*.dom.test.ts'];

/*
 * Four projects (the React package's `storybook` third has no Vue counterpart yet):
 *  - unit    — node, pure logic (foundation utils/themes/http + domain)
 *  - ssr     — node, `renderToString` only. NO DOM globals, deliberately: the whole point of
 *              the tier is that a component touching `window`/`document` at setup or from an
 *              `immediate: true` watcher throws here. Giving this project a DOM environment
 *              would silently retire the tier.
 *  - dom     — happy-dom, mounts SFCs via @vue/test-utils. Smoke depth only.
 *  - browser — real chromium, for anything needing layout, real focus, or true event timing.
 *
 * Suffix convention, carried over from the React package:
 *   `*.browser.test.ts` = needs a real DOM → browser project
 *   `*.dom.test.ts`     = mounts an SFC, smoke depth → dom project
 *   `*.ssr.test.ts`     = server-render only, must run WITHOUT a DOM → ssr project
 *   plain `*.test.ts` in the logic layers = pure logic → unit project
 */
export default defineConfig({
  resolve: { alias: srcAlias },
  test: {
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
          exclude: ['**/*.browser.test.ts', '**/*.component.test.ts', ...smokeSuffixes],
          // Scaffold-only: the logic layers this project owns have no tests yet — the first
          // wave is the component smoke layer (`ssr` + `dom`). Drop when logic tests land.
          passWithNoTests: true,
        },
      },
      {
        plugins: [vue()],
        resolve: { alias: srcAlias },
        test: {
          name: 'ssr',
          environment: 'node',
          include: ['tests/unit/**/*.ssr.test.ts'],
        },
      },
      {
        plugins: [vue()],
        resolve: { alias: srcAlias },
        test: {
          name: 'dom',
          environment: 'happy-dom',
          include: ['tests/unit/**/*.dom.test.ts'],
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
          // Scaffold-only: the smoke layer runs on happy-dom (`dom`), so nothing has claimed
          // the real-chromium tier yet. Drop when the first `*.browser.test.ts` lands.
          passWithNoTests: true,
        },
      },
    ],
  },
});
