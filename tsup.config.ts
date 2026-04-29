import { defineConfig } from 'tsup';

const folders = [
  'tokens',
  'tailwind',
  'utils',
  'hooks',
  'icons',
  'primitives',
  'actions',
  'display',
  'feedback',
  'forms',
  'layout',
];

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    ...Object.fromEntries(folders.map((f) => [`${f}/index`, `src/${f}/index.ts`])),
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['react', 'react-dom'],
});
