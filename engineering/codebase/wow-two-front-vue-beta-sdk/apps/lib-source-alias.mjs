import path from 'node:path';

/**
 * Component group -> physical layer folder under the lib's `src/`.
 *
 * Public subpaths are layer-prefixed (`@wow-two-beta/ui-vue/<layer>/<group>`) and
 * resolve to `src/<layer>/<group>/`. Keep in sync with `vite.config.ts`
 * (`subpathLayer`) and `package.json` exports. Ported 1:1 from the React
 * package's `apps/lib-source-alias.mjs`.
 */
export const subpathLayer = {
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

/**
 * Standalone top-level subpaths — NOT layer-prefixed, so they cannot come out
 * of `subpathLayer`. Mirrors the hand-written entries in `vite.config.ts`
 * (`declaredEntries`): each keeps an optional peer out of every other entry.
 *
 * Key = public subpath after `@wow-two-beta/ui-vue/`, value = source file.
 * Longest-first ordering is applied at build time so `query/testing` cannot be
 * shadowed by `query`.
 */
export const standaloneSubpaths = {
  router: 'src/router/index.ts',
  query: 'src/query/index.ts',
  'query/testing': 'src/query/testing.ts',
  auth: 'src/auth/index.ts',
  feedback: 'src/feedback/index.ts',
  analytics: 'src/analytics/index.ts',
  flags: 'src/flags/index.ts',
  'forms-engine': 'src/forms-engine/index.ts',
  'forms-engine/house': 'src/forms-engine/house/index.ts',
  'forms-engine/tanstack': 'src/forms-engine/tanstack/index.ts',
  'foundation/storage/zustand': 'src/foundation/storage/zustand/index.ts',
};

/**
 * Vite `resolve.alias` entries mapping every public subpath
 * (`@wow-two-beta/ui-vue/<layer>/<group>`, plus the standalone ones) to its live
 * source barrel, plus the root barrel. Order matters: specific subpaths before
 * the bare-root rule, and longer standalone paths before their prefixes.
 *
 * `extra` lets a caller prepend higher-priority aliases (e.g. styles.css)
 * that must win over the generated subpath rules.
 *
 * Aliasing to SOURCE (not `dist`) is the point: editing a component in `src/`
 * shows up on save with no `vite build --watch` step in the dev loop.
 *
 * @param {string} libRoot absolute path to the lib repo root
 * @param {{find: string|RegExp, replacement: string}[]} [extra]
 */
export function libSourceAliases(libRoot, extra = []) {
  const subpathAliases = Object.entries(subpathLayer).map(([group, layer]) => ({
    find: new RegExp(`^@wow-two-beta/ui-vue/${layer}/${group}$`),
    replacement: path.resolve(libRoot, `src/${layer}/${group}/index.ts`),
  }));

  // `foundation/storage/zustand` must be tried before `foundation/storage`; the
  // anchored regexes below make that moot, but the sort keeps the array's intent
  // readable and survives a future switch to string `find`s.
  const standaloneAliases = Object.entries(standaloneSubpaths)
    .sort(([a], [b]) => b.length - a.length)
    .map(([subpath, file]) => ({
      find: new RegExp(`^@wow-two-beta/ui-vue/${subpath.replace(/\//g, '\\/')}$`),
      replacement: path.resolve(libRoot, file),
    }));

  return [
    ...extra,
    ...standaloneAliases,
    ...subpathAliases,
    { find: /^@wow-two-beta\/ui-vue$/, replacement: path.resolve(libRoot, 'src/index.ts') },
  ];
}
