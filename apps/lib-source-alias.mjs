import path from 'node:path';

/**
 * Component group -> physical layer folder under the lib's `src/`.
 *
 * Public subpaths are layer-prefixed (`@wow-two-beta/ui/<layer>/<group>`) and
 * resolve to `src/<layer>/<group>/`. Keep in sync with `tsup.config.ts`
 * (`subpathLayer`) and `package.json` exports.
 */
export const subpathLayer = {
  utils: 'foundation',
  hooks: 'foundation',
  icons: 'foundation',
  primitives: 'foundation',
  themes: 'foundation',
  http: 'foundation',
  storage: 'foundation',
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
 * Vite `resolve.alias` entries mapping every public layered subpath
 * (`@wow-two-beta/ui/<layer>/<group>`) to its live source barrel at
 * `src/<layer>/<group>/index.ts`, plus the root barrel. Order matters:
 * specific subpaths before the bare-root rule.
 *
 * `extra` lets a caller prepend higher-priority aliases (e.g. styles.css,
 * themes.css/json) that must win over the generated subpath rules.
 *
 * @param {string} libRoot absolute path to the lib repo root
 * @param {{find: string|RegExp, replacement: string}[]} [extra]
 */
export function libSourceAliases(libRoot, extra = []) {
  const subpathAliases = Object.entries(subpathLayer).map(([group, layer]) => ({
    find: new RegExp(`^@wow-two-beta/ui/${layer}/${group}$`),
    replacement: path.resolve(libRoot, `src/${layer}/${group}/index.ts`),
  }));
  return [
    ...extra,
    ...subpathAliases,
    { find: /^@wow-two-beta\/ui$/, replacement: path.resolve(libRoot, 'src/index.ts') },
  ];
}
