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
        { type: 'root', pattern: 'src/index.ts' },
      ],
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'boundaries/element-types': [
        2,
        {
          default: 'disallow',
          rules: [
            { from: ['foundation'], allow: ['foundation'] },
            { from: ['domain'], allow: ['foundation'] },
            // Presentation → foundation + domain + any sibling presentation group.
            // Cross-group composition is allowed at all layers. Convention: L3 atoms /
            // L4 molecules stay in-group when natural; L5+ organisms compose freely.
            // The lint rule is permissive.
            { from: ['presentation'], allow: ['foundation', 'domain', 'presentation'] },
            { from: ['router'], allow: ['foundation', 'domain', 'presentation', 'router'] },
            { from: ['query'], allow: ['foundation', 'router', 'query'] },
            { from: ['auth'], allow: ['foundation', 'auth'] },
            { from: ['root'], allow: ['foundation', 'domain', 'presentation'] },
          ],
        },
      ],
    },
  },
  {
    // Test files + the local test kit cross layers freely — they exercise, not ship.
    files: ['src/**/*.test.{ts,tsx}', 'src/testing/**'],
    rules: {
      'boundaries/element-types': 'off',
    },
  },
);
