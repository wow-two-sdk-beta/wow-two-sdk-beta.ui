import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const libRoot = path.resolve(__dirname, '../..');

/* Aliases the published package paths to the lib source so every edit in
   `src/` hot-reloads here. No `tsup --watch` step needed in the dev loop. */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: true },
  resolve: {
    alias: [
      { find: '@wow-two-beta/ui/styles.css', replacement: path.resolve(libRoot, 'src/index.css') },
      { find: /^@wow-two-beta\/ui$/, replacement: path.resolve(libRoot, 'src/index.ts') },
      { find: /^@wow-two-beta\/ui\/(.*)$/, replacement: path.resolve(libRoot, 'src/$1/index.ts') },
    ],
  },
});
