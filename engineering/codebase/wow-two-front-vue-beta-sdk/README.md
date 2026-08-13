# @wow-two-beta/ui-vue

> ⚠️ **Beta-forever.** `0.x.y` with no semver guarantees, no CHANGELOG, no API stability, no graduation roadmap. Ship fast, fix-forward. Pin exact versions if stability matters.

The Vue 3 port of [`@wow-two-beta/ui`](../wow-two-front-beta-sdk) — same layering, same token contract, same public subpath map, Vue components instead of React ones.

The package is **self-contained**: the framework-agnostic layer (utils, themes engine, http, formatters, …) is copied rather than depended on. Deliberate for the pilot — the two packages evolve independently until the port proves out.

**Coming from `@wow-two-beta/ui`? → [`MIGRATION.md`](./MIGRATION.md)** — every API delta in one list.

## What's in the box

| Layer | Ships |
|---|---|
| `presentation/*` | 231 components across `actions` (14) · `display` (73) · `feedback` (27) · `forms` (74) · `layout` (24) · `nav` (11) · `overlays` (8) — 389 SFCs |
| `foundation/*` | 21 modules — incl. `primitives` (17 headless), `hooks` (17 composables), `utils`, `themes`, `icons`, `http`, `storage`, `validation`, `datetime`, `format`, `resilience` |
| `domain/*` | `color` · `emoji` |
| standalone | `router` · `query` (+ `query/testing`) · `auth` · `feedback` · `analytics` · `flags` · `forms-engine` (+ `house` + `tanstack`) |

Every `presentation` group matches the React package folder-for-folder. Not yet ported: 20 of the React package's 41 `foundation` modules — `animation`, `clipboard`, `commands`, `device`, `geolocation`, `gestures`, `i18n`, `media`, `net`, `notifications`, `observers`, `screen`, `selection`, `share`, `speech`, `sync`, `undo`, `uploads`, `virtualization`, `workers`. `package.json` declares export subpaths for all 41 ahead of the source, so importing one of the 20 fails at resolve time — see [`MIGRATION.md` §11](./MIGRATION.md#11-known-gaps).

## Install

```bash
pnpm add @wow-two-beta/ui-vue vue
```

Three peers are **optional** — install only what the subpaths you import need:

| Peer | Needed by |
|---|---|
| `vue-router@^4` | `@wow-two-beta/ui-vue/router` |
| `@tanstack/vue-query@^5` | `@wow-two-beta/ui-vue/query` |
| `@tanstack/vue-form@^1` | `@wow-two-beta/ui-vue/forms-engine/tanstack` |

The root entry and every `foundation` / `domain` / `presentation` subpath are peer-free.

## Use

The root barrel re-exports all seven presentation groups flat, plus `utils` / `hooks` / `icons` / `primitives` / `themes` / `color` / `emoji` as namespaces:

```vue
<script setup lang="ts">
import { Button } from '@wow-two-beta/ui-vue';
import '@wow-two-beta/ui-vue/styles.css';
</script>

<template>
  <Button variant="solid" @click="save">Save</Button>
</template>
```

Subpath imports for tree-shake-friendly consumption — one per layer/group, mirroring the React package 1:1:

```ts
import { Button } from '@wow-two-beta/ui-vue/presentation/actions';
import { cn } from '@wow-two-beta/ui-vue/foundation/utils';
import { THEMES } from '@wow-two-beta/ui-vue/foundation/themes';
import { useAppForm } from '@wow-two-beta/ui-vue/forms-engine/house';
```

`router`, `query`, `forms-engine`, `auth`, `feedback`, `analytics` and `flags` are **not** on the root barrel — reach them by subpath, so their peers never ride along:

```ts
import { createAppRouter } from '@wow-two-beta/ui-vue/router';
import { queryPlugin, useAppQuery } from '@wow-two-beta/ui-vue/query';
```

## Stack

- Vue 3.5+ · `<script setup>` SFCs (no TSX) · TypeScript strict
- **Tailwind v4**, CSS-first via `@theme` — `src/index.css` is copied verbatim from the React package and shipped unprocessed; consumers run it through their own Tailwind
- `@floating-ui/vue` · `lucide-vue-next` · `tailwind-variants`
- Build: Vite library mode (`@vitejs/plugin-vue` + `vite-plugin-dts`), multi-entry, ESM only
- Lint: ESLint 9 flat config — `eslint-plugin-vue` + `typescript-eslint` + `eslint-plugin-boundaries`
- Tests: Vitest 4, four projects — `unit` (node) · `ssr` · `dom` · `browser` (Playwright chromium + `@vue/test-utils`). Smoke layer (mount + a11y), not the React package's story-driven suite.

## Develop

```bash
pnpm install
pnpm build        # vite lib build + dts + index.css + themes.css/json
pnpm dev          # vite build --watch
pnpm typecheck    # vue-tsc --noEmit + scripts/check-sfc.mjs (real SFC compile — vue-tsc green ≠ buildable)
pnpm check:sfc    # just the SFC compile pass
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
- `src/index.ts` — the root barrel. Mirrors the React package's: foundation/domain namespaces + the seven presentation groups flat, and nothing that carries a peer.

## Casing

Folders `camelCase` · files `PascalCase` (`Button.vue`, `ButtonStyles.ts`) · index files lowercase (`index.ts`).

## Release

CI (`.github/workflows/release-vue.yml`) validates, auto-bumps `0.0.y`, and publishes on every push to `main` that touches this directory. Tags are prefixed `ui-vue-v*` so they never collide with the React package's `v*` tags.

## License

MIT
