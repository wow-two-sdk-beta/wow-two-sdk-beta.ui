# Handoff — SDK organize (v0.1)

*Last updated: 2026-07-11*

Fresh-chat handoff for `@wow-two-beta/ui` (the frontend SDK). The forms vector is complete; the repo is mid-reorganize. Primary task = apply the SDK repo layout on a clean tree. Read this + the linked spec; nothing else needs pre-reading.

## Repo state

- pkg `@wow-two-beta/ui` @ `0.0.97` (npm; CI auto-bumps `0.0.y` per push). Restructure folder slug = **`wow-two-front-beta-sdk`** (npm renamed to match the backend SDK later — separate task).
- Suite GREEN: **1813 tests** across 3 vitest projects — `unit` (node) · `browser` (Playwright chromium) · `storybook` (`@storybook/addon-vitest`: every story = smoke, `play()` = interaction). `pnpm test` · `typecheck` · `lint` · `build` all exit 0.
- axe wired report-only (`.storybook/preview.ts` `a11y.test: 'todo'`) — 72 stories violate (burn-down deferred).
- Shipped: all component groups · `router` · `query` (both reviewed migration-ready) · `auth` · `feedback` · `foundation/http` (api-client) · `forms-engine` (house + tanstack). Local test kit `src/testing/`.

---

## PRIMARY TASK — apply the SDK layout (v0.1 iter 1)

Spec (authoritative): `wow-two-ws/conventions/development/repo/structure/sdk-structure.md`. Do it on a CLEAN tree, **staged, verify green between stages**. Story-extraction is proven feasible (see the convention + `docs/analysis` note it folds in).

**Stage A — relocate the whole package (one atomic unit):**
- create `engineering/codebase/wow-two-front-beta-sdk/`; move the ENTIRE package into it — `package.json` · `pnpm-lock.yaml` · `pnpm-workspace.yaml` · `tsconfig*.json` · `tsup.config.ts` · `vitest.config.ts` · `eslint.config.js` · `.prettierrc`/`.editorconfig`/`.npmrc` · `.storybook/` · `src/` · `apps/` · `scripts/` · `dist/` · `.vitest-attachments/`. Relative globs preserved → **~0 edits** to the 6 src-globbing configs.
- copy `LICENSE` + a package `README.md` beside `package.json` (the `files` allowlist can't pack above the package root).
- root KEEPS: `.git` · `.github/` · `.claude/` · `README.md` · `CLAUDE.md` · `engineering/` (`planning/` + `architecture/` — siblings of `codebase/`).
- ~5 external edits: both `.github/workflows/*.yml` `working-directory` · `package.json` `repository.directory` · `.gitignore` · `wow-two-ws/scripts/active.sh`.
- VERIFY: `pnpm -C engineering/codebase/wow-two-front-beta-sdk {build,test,typecheck,lint}` all green (1813) + `npm pack --dry-run` (dist contents unchanged). STOP + report if red.

**Stage B — split tests + stories out of `src/`:**
- `src/**/*.test.ts(x)` → `tests/unit/**` (mirror the src tree) · `src/**/*.stories.tsx` → `tests/stories/**` (mirror). `src/` is source-only after.
- move the internal `src/testing/` kit → `tests/` — BUT `src/query/testing.ts` SHIPS (published subpath `./query/testing`) and STAYS in src.
- add one `@src/*` tsconfig path alias; rewrite moved files' imports (`./Foo` → `@src/.../Foo`).
- repoint: vitest `unit`+`browser` includes → `tests/unit/**` · `.storybook/main.ts` stories glob → `tests/stories/**` · eslint test/story override → `tests/**` (boundaries stay `src/**`) · `tsconfig.typecheck.json` include `tests/**`.
- VERIFY green again (1813). This is the big mechanical step (~50 test + 227 story files + their imports).

---

## Remaining v0.1 iterations (after the apply)

Registry: `engineering/planning/version-track/v0.1.md`.

- **iter 2 — docs hygiene:** audit `docs/` (or `engineering/architecture/` post-move): delete stale-but-fully-implemented (verify by code-sweep — `enum-alignment` is a candidate) · split each vector-analysis: shipped facts → `wow-two-ws` conventions, forward-looking stays.
- **iter 3 — component index + docs convention:** the catalog (index + per-type + snippet).
- **iter 4 — vector registry:** master list ALL vectors (shipped + possible-unbuilt); refresh `docs/analysis/ui-philosophy/targets.md`, don't rebuild.
- **iter 5 — foundation data contracts (GREENFIELD, additive; both analyses DONE):** pagination — `IHas*` **generic** composables (`IHasPageToken<TToken>`, `IHasPageSize`, `IHasTotalCount`, `IHasQueryTiming`) → `Page<T>`/`TokenPage<T>` @ `foundation/http/Page.ts` (`docs/analysis/pagination-model.md`) · Guid — branded-string `Guid` @ `foundation/identifiers/Guid.ts` (`docs/analysis/guid-type.md`, own ~25-LOC v7).
- **iter 6 — fold forms → conventions:** how-we-do-forms (entities + snippet + component index).
- **iter 7 — analysis → tasks:** convert the consolidated analyses into iteration rows.

---

## Key decisions (do not relitigate)

- **SDK doctrine:** build the whole vector proactively (a product's need is the trigger, not the scope). `wow-two-ws/conventions/development/dev-cycle.md` §Vector completeness + workspace `CLAUDE.md`.
- **Swappable modules:** house contract + adapter subpaths (optional peers) + one shared conformance suite + one-line app pin. `conventions/development/swappable-modules.md`.
- **Forms:** options-object, NOT a fluent builder (a hook re-runs every render). App pins the engine in `src/form.ts`.
- **Pagination:** `IHas*` prefix + generic `IHasPageToken<TToken>`.
- **Guid:** branded string; `createV4` parallels `NewGuid()` (there is no .NET `CreateVersion4`).

---

## Deep-reference analyses (don't re-derive)

`docs/analysis/`: `forms-{engine,vector-next,completeness,deferred-items}` · `pagination-model` · `guid-type` · `lib-adoption` · `frontend-modules{,-products,-ecosystem}` · `{router,query}-review` · `http-query-integration`. In `wow-two-ws/docs/`: `conventions-taxonomy.md`.

## Deferred (trigger-gated — not "next")

autosave (→ storage v2, module wave W2-c) · a11y burn-down + `'todo'`→`'error'` flip · i18n (its own vector, P6 — 43 hard-coded field strings) · RHF adapter (RHF v8 stable + a consumer asking) · `dataTable`/`dataGrid` deep interaction tests · visual regression (design-system freeze) · npm rename `@wow-two-beta/ui` → backend-SDK-aligned.

## Working rules

- NEVER `git commit`/`push` (hook-enforced) — stage + draft the message, the human commits. Other chats share this tree — never revert unfamiliar changes, stay in-lane (`conventions/agentic-workflow/agentic-workflow.md`).
- Super-compact response style (`wow-two-ws/.claude/rules/response-style.md`). No `>` blockquote lead-in in track/planning docs (owner preference).
- Conventions were just reshaped: repo shape under `conventions/development/repo/structure/`, hosting under `conventions/deployment/hosting/`. If a doc link 404s, the path moved there.
