/* ---------------------------------------------------------------------------
 * @wow-two-beta/ui-vue — root barrel.
 *
 * Mirrors the React package's `src/index.ts` line for line, so the two stay
 * diffable. Subpath imports (`@wow-two-beta/ui-vue/foundation/utils`, …) remain
 * the preferred form; the root is the convenience entry.
 *
 * Peer-free by construction. `router`, `query`, `forms-engine` (and its
 * `house` / `tanstack` entries), `auth` and the root `feedback` module are
 * deliberately NOT re-exported here — they pull the optional peers
 * (`vue-router`, `@tanstack/vue-query`, `@tanstack/vue-form`), and importing
 * the root must never make a consumer install them. Reach those by subpath.
 * ------------------------------------------------------------------------- */

// Foundation — preferred via subpath imports, also namespaced from root for convenience
export * as utils from './foundation/utils';
export * as hooks from './foundation/hooks';
export * as icons from './foundation/icons';
export * as primitives from './foundation/primitives';
export * as themes from './foundation/themes';
export * as color from './domain/color';
export * as emoji from './domain/emoji';

// Domains — flat re-export for convenience
export * from './presentation/actions';
export * from './presentation/display';
export * from './presentation/feedback';
export * from './presentation/forms';
export * from './presentation/layout';
export * from './presentation/nav';
export * from './presentation/overlays';
