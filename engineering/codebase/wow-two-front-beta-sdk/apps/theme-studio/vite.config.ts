import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { libSourceAliases } from '../lib-source-alias.mjs';

const libRoot = path.resolve(__dirname, '../..');

/* Same alias trick as apps/showcase: published package paths resolve to the lib
   source, so theme-studio renders live `src/` (incl. the theme engine at
   `src/foundation/themes`) with HMR and never depends on a stale `dist/`.
   `base: './'` + hash routing keeps the build deployable under any GitHub Pages
   path. Layered subpaths (`@wow-two-beta/ui/<layer>/<group>`) resolve via the
   shared map in `apps/lib-source-alias.mjs`; the css/json artifacts below are
   prepended as higher-priority extras. */
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: Number(process.env.PORT) || 5175 },
  resolve: {
    alias: libSourceAliases(libRoot, [
      { find: '@wow-two-beta/ui/styles.css', replacement: path.resolve(libRoot, 'src/index.css') },
      /* themes.css / themes.json are pure build artifacts (no `src/` twin) —
         emitted by scripts/build-themes-css.mjs from the same source `THEMES`
         the app imports, so dist stays in lockstep with the engine source.
         Aliased explicitly since they have no source barrel to resolve to. */
      { find: '@wow-two-beta/ui/themes.css', replacement: path.resolve(libRoot, 'dist/themes.css') },
      { find: '@wow-two-beta/ui/themes.json', replacement: path.resolve(libRoot, 'dist/themes.json') },
    ]),
  },
});
