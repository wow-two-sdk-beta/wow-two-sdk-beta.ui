import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const libRoot = path.resolve(__dirname, '../..');

/* Same alias trick as apps/playground: published package paths resolve to the
   lib source, so the showcase renders live `src/` with HMR and never depends
   on a stale `dist/`. `base: './'` + hash routing keeps the build deployable
   under any GitHub Pages path. */
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: Number(process.env.PORT) || 5174 },
  resolve: {
    alias: [
      { find: '@wow-two-beta/ui/styles.css', replacement: path.resolve(libRoot, 'src/index.css') },
      { find: /^@wow-two-beta\/ui$/, replacement: path.resolve(libRoot, 'src/index.ts') },
      { find: /^@wow-two-beta\/ui\/(.*)$/, replacement: path.resolve(libRoot, 'src/$1/index.ts') },
    ],
  },
});
