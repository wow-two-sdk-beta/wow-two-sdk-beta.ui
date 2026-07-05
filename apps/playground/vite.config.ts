import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { libSourceAliases } from '../lib-source-alias.mjs';

const libRoot = path.resolve(__dirname, '../..');

/* Aliases the published package paths to the lib source so every edit in
   `src/` hot-reloads here. No `tsup --watch` step needed in the dev loop.
   Subpaths resolve to their physical layer folder (`src/<layer>/<sub>/index.ts`)
   via the shared map in `apps/lib-source-alias.mjs`. */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: true },
  resolve: {
    alias: libSourceAliases(libRoot, [
      { find: '@wow-two-beta/ui/styles.css', replacement: path.resolve(libRoot, 'src/index.css') },
    ]),
  },
});
