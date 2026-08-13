# @wow-two-beta/ui-vue

> ⚠️ **Beta-forever.** `0.x.y` with no semver guarantees, no CHANGELOG, no API stability, no graduation roadmap. Ship fast, fix-forward. Pin exact versions if stability matters.

The Vue 3 port of [`@wow-two-beta/ui`](../wow-two-front-beta-sdk) — same layering, same token contract, same public subpath map, Vue components instead of React ones.

The package is **self-contained**: the framework-agnostic layer (utils, themes engine, http, formatters, …) is copied rather than depended on. Deliberate for the pilot — the two packages evolve independently until the port proves out.

## Install

```bash
pnpm add @wow-two-beta/ui-vue
```

## Use

```vue
<script setup lang="ts">
import { Button } from '@wow-two-beta/ui-vue';
import '@wow-two-beta/ui-vue/styles.css';
</script>
```

Subpath imports for tree-shake-friendly consumption — one per layer/group, mirroring the React package 1:1:

```ts
import { Button } from '@wow-two-beta/ui-vue/presentation/actions';
import { cn } from '@wow-two-beta/ui-vue/foundation/utils';
import { THEMES } from '@wow-two-beta/ui-vue/foundation/themes';
```

## Stack

- Vue 3.5+ · `<script setup>` SFCs (no TSX) · TypeScript strict
- **Tailwind v4**, CSS-first via `@theme` — `src/index.css` is copied verbatim from the React package and shipped unprocessed; consumers run it through their own Tailwind
- `@floating-ui/vue` · `lucide-vue-next` · `tailwind-variants`
- Build: Vite library mode (`@vitejs/plugin-vue` + `vite-plugin-dts`), multi-entry, ESM only
- Lint: ESLint 9 flat config — `eslint-plugin-vue` + `typescript-eslint` + `eslint-plugin-boundaries`
- Tests: Vitest 4 — `unit` (node) · `browser` (Playwright chromium + `@vue/test-utils`)

## Develop

```bash
pnpm install
pnpm build        # vite lib build + dts + index.css + themes.css/json
pnpm dev          # vite build --watch
pnpm typecheck    # vue-tsc --noEmit
pnpm lint         # ESLint, layering enforced by eslint-plugin-boundaries
pnpm test         # all projects
pnpm test:unit    # node project
pnpm test:browser # chromium project
pnpm coverage     # report-only, never a gate
```

## Layering

Enforced by `eslint-plugin-boundaries`, identical to the React package:

- `src/foundation/*` — infra. May import `foundation` only.
- `src/domain/*` — pure types/ops. May import `foundation`.
- `src/presentation/*` — components. May import `foundation`, `domain`, and any sibling presentation group.
- `src/{router,query,auth,feedback,forms-engine,analytics,flags}` — standalone top-level subpaths, each keeping its optional peer out of every other entry.

## Casing

Folders `camelCase` · files `PascalCase` (`Button.vue`, `ButtonStyles.ts`) · index files lowercase (`index.ts`).

## Release

CI (`.github/workflows/release-vue.yml`) validates, auto-bumps `0.0.y`, and publishes on every push to `main` that touches this directory. Tags are prefixed `ui-vue-v*` so they never collide with the React package's `v*` tags.

## License

MIT
