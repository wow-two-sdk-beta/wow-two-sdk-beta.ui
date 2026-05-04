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
        {
          type: 'foundation',
          pattern: 'src/(tokens|tailwind|utils|hooks|icons|primitives)/**',
        },
        {
          type: 'domain',
          pattern: 'src/(actions|display|feedback|forms|layout|nav|overlays)/*/**',
          capture: ['domain'],
        },
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
            // Domain → any domain. Cross-domain composition is allowed at all layers.
            // Convention: L3 atoms / L4 molecules should stay in-domain when natural;
            // L5+ organisms freely compose across domains. The lint rule is permissive.
            { from: ['domain'], allow: ['foundation', 'domain'] },
            { from: ['root'], allow: ['foundation', 'domain'] },
          ],
        },
      ],
    },
  },
);
