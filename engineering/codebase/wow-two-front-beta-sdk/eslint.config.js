import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'storybook-static/**',
      'node_modules/**',
      'apps/**',
      'scripts/**',
      '*.config.{js,ts}',
      '.storybook/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      boundaries,
    },
    settings: {
      // REQUIRED for boundaries to work at all: the plugin resolves import targets via
      // eslint-module-utils, whose default node resolver can't resolve .ts/.tsx — every
      // target then classifies as "unknown" and boundaries/element-types silently passes.
      // Smoke-test after touching this config: add `import * as x from '../presentation/actions'`
      // to a file in src/auth/ → `pnpm exec eslint` on it MUST error (then remove it).
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['tsconfig.json'],
        },
      },
      'boundaries/elements': [
        // Physical layer folders under src/. Foundation = infra (no upward deps);
        // domain = pure types/ops (may use foundation); presentation = components
        // (may use foundation + domain + sibling presentation).
        {
          type: 'foundation',
          pattern: 'src/foundation/*/**',
        },
        {
          type: 'domain',
          pattern: 'src/domain/*/**',
        },
        {
          type: 'presentation',
          pattern: 'src/presentation/*/**',
          capture: ['group'],
        },
        // Router = standalone top-level subpath layer above presentation; composes
        // presentation (AppNavLink → NavItem) + foundation, never imported by them.
        { type: 'router', pattern: 'src/router/**' },
        // Query = standalone top-level subpath data layer; composes foundation (ApiError coercion)
        // + router (QueryProgressBridge → useNavigationProgress), never imported by them.
        { type: 'query', pattern: 'src/query/**' },
        // Auth = standalone top-level subpath session layer; peer-free, composes
        // foundation only (http client seams), never imported by other layers.
        { type: 'auth', pattern: 'src/auth/**' },
        // Feedback = standalone top-level subpath notice bus; peer-free, composes
        // foundation only (Severity vocabulary, ApiError type) — NEVER presentation.
        // Presentation adapters (FeedbackToasts) import it, not the other way round.
        { type: 'feedback', pattern: 'src/feedback/**' },
        // Forms-engine = standalone top-level subpath forms facade (contract + engine
        // adapters); composes foundation only (FormControlContext provider, http error
        // seams) — NEVER presentation: label/error chrome (presentation `Field`,
        // `FormErrorMessage`) composes INSIDE the render prop, app- or presentation-side.
        { type: 'forms-engine', pattern: 'src/forms-engine/**' },
        // Analytics + flags = standalone top-level subpath layers, peer-free, composing foundation only.
        // Like `feedback`, they are headless buses/evaluators a presentation adapter may consume — never
        // the other way round.
        { type: 'analytics', pattern: 'src/analytics/**' },
        { type: 'flags', pattern: 'src/flags/**' },
        { type: 'root', pattern: 'src/index.ts' },
      ],
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Surface imports of local files that match no boundaries/elements pattern —
      // element-types ignores unknowns, so without this a typo'd/unmodeled layer slips through.
      'boundaries/no-unknown': 2,
      'boundaries/element-types': [
        2,
        {
          default: 'disallow',
          rules: [
            { from: ['foundation'], allow: ['foundation'] },
            // Self-allow is required (as in every other layer): each file is its own
            // element instance, so even `./sibling` imports inside one domain cross elements.
            { from: ['domain'], allow: ['foundation', 'domain'] },
            // Presentation → foundation + domain + any sibling presentation group.
            // Cross-group composition is allowed at all layers. Convention: L3 atoms /
            // L4 molecules stay in-group when natural; L5+ organisms compose freely.
            // The lint rule is permissive.
            // `feedback` here = the headless bus module a presentation adapter may subscribe to.
            { from: ['presentation'], allow: ['foundation', 'domain', 'presentation', 'feedback'] },
            { from: ['router'], allow: ['foundation', 'domain', 'presentation', 'router'] },
            { from: ['query'], allow: ['foundation', 'router', 'query'] },
            { from: ['auth'], allow: ['foundation', 'auth'] },
            { from: ['feedback'], allow: ['foundation', 'feedback'] },
            { from: ['forms-engine'], allow: ['foundation', 'forms-engine'] },
            { from: ['analytics'], allow: ['foundation', 'analytics'] },
            { from: ['flags'], allow: ['foundation', 'flags'] },
            { from: ['root'], allow: ['foundation', 'domain', 'presentation'] },
          ],
        },
      ],
    },
  },
  {
    // Test files, stories, + the local test kit cross layers freely — they exercise,
    // not ship (stories are build-excluded and import src/testing + .storybook helpers).
    // `*.shared.{ts,tsx}` = shared test suites (forms-engine conformance) — test infra too.
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      'boundaries/element-types': 'off',
      'boundaries/no-unknown': 'off',
    },
  },
);
