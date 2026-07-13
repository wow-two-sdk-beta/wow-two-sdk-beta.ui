import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { libSourceAliases } from '../lib-source-alias.mjs';

const libRoot = path.resolve(__dirname, '../..');

/* Same alias trick as apps/playground: published package paths resolve to the
   lib source, so the showcase renders live `src/` with HMR and never depends
   on a stale `dist/`. `base: './'` + hash routing keeps the build deployable
   under any GitHub Pages path. Subpaths resolve to their physical layer folder
   via the shared map in `apps/lib-source-alias.mjs`. */
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: Number(process.env.PORT) || 5174 },
  resolve: {
    alias: libSourceAliases(libRoot, [
      { find: '@wow-two-beta/ui/styles.css', replacement: path.resolve(libRoot, 'src/index.css') },
    ]),
  },
});
