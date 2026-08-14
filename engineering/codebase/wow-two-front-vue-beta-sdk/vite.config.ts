import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

const here = dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(readFileSync(resolve(here, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

// Component group -> physical layer folder under `src/`. Public subpaths are
// layer-prefixed (`@wow-two-beta/ui-vue/<layer>/<group>`) and `dist/` mirrors the
// layers 1:1 (`dist/<layer>/<group>/index.*`). Keep in sync with `package.json`
// exports. Ported 1:1 from the React package's `tsup.config.ts`.
const subpathLayer: Record<string, 'foundation' | 'domain' | 'presentation'> = {
  utils: 'foundation',
  hooks: 'foundation',
  icons: 'foundation',
  primitives: 'foundation',
  themes: 'foundation',
  http: 'foundation',
  storage: 'foundation',
  resilience: 'foundation',
  identifiers: 'foundation',
  i18n: 'foundation',
  config: 'foundation',
  shortcuts: 'foundation',
  format: 'foundation',
  files: 'foundation',
  commands: 'foundation',
  errors: 'foundation',
  share: 'foundation',
  logger: 'foundation',
  device: 'foundation',
  notifications: 'foundation',
  uploads: 'foundation',
  gestures: 'foundation',
  selection: 'foundation',
  media: 'foundation',
  animation: 'foundation',
  virtualization: 'foundation',
  observers: 'foundation',
  crypto: 'foundation',
  sync: 'foundation',
  idb: 'foundation',
  workers: 'foundation',
  screen: 'foundation',
  geolocation: 'foundation',
  async: 'foundation',
  undo: 'foundation',
  clipboard: 'foundation',
  speech: 'foundation',
  collections: 'foundation',
  datetime: 'foundation',
  validation: 'foundation',
  net: 'foundation',
  oauth: 'foundation',
  color: 'domain',
  emoji: 'domain',
  actions: 'presentation',
  display: 'presentation',
  feedback: 'presentation',
  forms: 'presentation',
  layout: 'presentation',
  nav: 'presentation',
  overlays: 'presentation',
};

// Entry KEY = dist path (`dist/<layer>/<group>/index.js`) — mirrors the layered
// source folder so the emitted subpath matches the public export in `package.json`.
const declaredEntries: Record<string, string> = {
  index: 'src/index.ts',
  // `router` is a standalone top-level subpath (`@wow-two-beta/ui-vue/router`), not layer-prefixed
  // like the component groups below — this keeps its `vue-router` peer out of every other entry.
  'router/index': 'src/router/index.ts',
  // `query` mirrors `router` — standalone top-level subpath whose optional `@tanstack/vue-query`
  // peer stays out of every other entry. `query/testing` is a second entry for test-only helpers.
  'query/index': 'src/query/index.ts',
  'query/testing': 'src/query/testing.ts',
  // `auth` mirrors `router`/`query` — standalone top-level subpath, no peer of its own
  // (plain Vue + foundation/http types); the headless session client stays importable
  // without pulling any presentation entry.
  'auth/index': 'src/auth/index.ts',
  // `feedback` mirrors `auth` — standalone top-level subpath, peer-free; the headless notice
  // bus stays importable without any presentation entry (the toast adapter ships in
  // `presentation/feedback`).
  'feedback/index': 'src/feedback/index.ts',
  // `analytics` + `flags` mirror `feedback` — standalone top-level subpaths, peer-free. The
  // headless event bus / flag evaluator stay importable without pulling any presentation entry.
  'analytics/index': 'src/analytics/index.ts',
  'flags/index': 'src/flags/index.ts',
  // `forms-engine` — the engine-free forms facade contract (types + glue + server-error
  // pipeline, zero peer). Each engine adapter is its own sibling entry so an adapter's peer
  // never rides along: `forms-engine/house` is the zero-dependency micro-engine;
  // `forms-engine/tanstack` is the default adapter (optional `@tanstack/vue-form` peer →
  // external below) — importing `/forms-engine` or `/house` must never pull it.
  'forms-engine/index': 'src/forms-engine/index.ts',
  'forms-engine/house/index': 'src/forms-engine/house/index.ts',
  'forms-engine/tanstack/index': 'src/forms-engine/tanstack/index.ts',
  // `foundation/storage/zustand` — the zustand-persist adapter. A nested subpath (below the
  // layer-prefixed `foundation/storage`), so it needs an explicit entry rather than the
  // `subpathLayer` one-level generation. No zustand peer: it only mirrors zustand's
  // `PersistStorage` shape structurally.
  'foundation/storage/zustand/index': 'src/foundation/storage/zustand/index.ts',
  ...Object.fromEntries(
    Object.entries(subpathLayer).map(([group, layer]) => [
      `${layer}/${group}/index`,
      `src/${layer}/${group}/index.ts`,
    ]),
  ),
};

// The port lands layer by layer, so some entries above have no source file yet (wave W1d in
// `engineering/planning/vue-port-track.md`). Building only what exists keeps `pnpm build` usable
// during the migration; the full map stays declared so an entry starts emitting the moment its
// `index.ts` lands. Remove this filter once the port closes.
//
// The skip is announced, never silent: a filtered entry is a `package.json` export subpath that
// resolves to nothing, so a consumer importing it gets ERR_MODULE_NOT_FOUND. Decision D5 keeps the
// export map mirroring the React package 1:1, so the gap is expected until W1d lands — but it must
// be visible on every build rather than discovered after publish.
const skipped = Object.entries(declaredEntries).filter(([, file]) => !existsSync(resolve(here, file)));

const entry = Object.fromEntries(
  Object.entries(declaredEntries).filter(([, file]) => existsSync(resolve(here, file))),
);

if (skipped.length > 0) {
  const subpaths = skipped.map(([name]) => `@wow-two-beta/ui-vue/${name.replace(/\/index$/, '')}`);
  console.warn(
    `\n[entries] ${Object.keys(entry).length}/${Object.keys(declaredEntries).length} entries resolved — ` +
      `${skipped.length} skipped, no source yet (wave W1d).\n` +
      `[entries] These package.json export subpaths will NOT resolve for consumers:\n` +
      subpaths.map((s) => `  - ${s}`).join('\n') +
      `\n`,
  );
}

// tsup auto-externalizes `dependencies` + `peerDependencies`; Vite's lib mode does not, so
// reproduce it here — otherwise `clsx`/`tailwind-merge`/… get inlined into all ~50 entries.
// `@vue/test-utils` (a devDep) is external only so the `query/testing` entry references it
// rather than inlining it.
const externalPackages = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  '@vue/test-utils',
];

const isExternal = (id: string) =>
  id.startsWith('node:') ||
  externalPackages.some((name) => id === name || id.startsWith(`${name}/`));

export default defineConfig({
  resolve: {
    // Mirrors the `@src/*` path in tsconfig.json — tests reach back into source through it.
    alias: { '@src': resolve(here, 'src') },
  },
  plugins: [
    vue(),
    dts({
      tsconfigPath: resolve(here, 'tsconfig.json'),
      entryRoot: resolve(here, 'src'),
      outDir: resolve(here, 'dist'),
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.vue'],
      // One .d.ts per source file, mirroring `dist/` 1:1 — no rollup of types (the React
      // package hit rollup-plugin-dts ENFILE issues on macOS; keep the flat emit here too).
      rollupTypes: false,
      insertTypesEntry: false,
      staticImport: true,
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
    minify: false,
    // Every entry keeps its own CSS import graph out of a single shared bundle; `src/index.css`
    // is copied verbatim by the `build` script (consumers run it through their own Tailwind).
    cssCodeSplit: true,
    lib: {
      entry,
      formats: ['es'],
    },
    rollupOptions: {
      external: isExternal,
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
