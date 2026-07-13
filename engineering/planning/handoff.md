# Handoff — `@wow-two-beta/ui`

*Last updated: 2026-07-13*

Fresh-chat handoff. Repo is GREEN and mid-way through **vector-improvement** work (the v0.1 *organize* track is fully done). Read this + the linked docs; nothing else needs pre-reading.

## Repo state

- pkg `@wow-two-beta/ui` @ `0.0.10x` (npm; CI auto-bumps `0.0.y` per push). Code dir: `engineering/codebase/wow-two-front-beta-sdk/` (run all `pnpm` from there).
- Suite **GREEN: 1898 tests** across 3 vitest projects — `unit` (node) · `browser` (Playwright chromium) · `storybook` (`play()` = interaction). `pnpm build|typecheck|lint|test` all exit 0.
- **Uncommitted** (agent can't commit — see rules; owner commits at end): a prior lane's staged i18n foundation + Toaster `content`/`onDismiss`, **plus this session's** `foundation/config` + storage-v2 (incl. `foundation/storage/zustand`) + `useAutosave` vectors. All green; commit as logical `feat:` chunks when ready.

## Live planning (source of truth)

- [`planning.md`](./planning.md) — vectors table + iterations (active/queued) + **Backlog (trigger-gated)**.
- [`version-track/v0.1.md`](./version-track/v0.1.md) — v0.1 iterations **1–7 DONE**, iter 8 scheduled.
- [`../architecture/vector-registry.md`](../architecture/vector-registry.md) — every vector (shipped subpaths · §2 cross-cutting · module waves · deferred).
- [`../architecture/component-catalog.md`](../architecture/component-catalog.md) — 248 components, **derived** (`node ../architecture/gen-catalog.mjs` to regen).

## Done (latest session — 2026-07-13, Wave-2 module vectors)

- **`foundation/config` (W2-b, new subpath)** — `defineConfig(schema, {sources, prefix})` typed-env reader. 8 field builders (`str`/`num`/`bool`/`oneOf`/`url`/`port`/`json`/`list`) w/ `required`/`default`/`secret`; ordered sources (`windowConfigSource` runtime ahead of `importMetaEnvSource` build-time, `staticSource` for tests); empty-string = absent; **fail-fast** — aggregates every missing/invalid key into one `ConfigError` at startup; secret redaction. Files: `src/foundation/config/{ConfigField,ConfigSource,DefineConfig,index}.ts` + `tests/unit/foundation/config/config.test.ts` (18). Wired at 4 points (tsup `subpathLayer` · `package.json` exports · vitest unit `include` · `apps/lib-source-alias.mjs` — also backfilled the map's missing resilience/identifiers/i18n).
- **`foundation/storage` v2 (W2-c, done)** — `namespacedBroker(inner, ns)` key-prefix decorator (composes/nests) + `createVersionedStore({key,version,initial,migrations,broker})` (`{v,data}` envelope · on-read migration chain `migrations[n]: n→n+1` w/ write-back upgrade · legacy-bare-value → v0 · newer-version + chain-gap + any-throw all degrade to `initial`). Files: `src/foundation/storage/{NamespacedBroker,VersionedStore}.ts` + barrel + `storageV2.test.ts` (12).
- **`foundation/storage/zustand` persist adapter (new nested subpath)** — `brokerPersistStorage(broker)` returns a zustand-v5 `PersistStorage`-shaped object so a zustand store persists through the same swappable broker (memory in tests · `namespacedBroker` isolation · SSR-safe local in prod). **Zero zustand dep** — the `PersistStorage`/`StorageValue` types are a *structural mirror* (like `forms-engine/StandardSchema.ts`), so consumers bring zustand and pass this into `persist({ storage })`. Versioning stays with zustand's own `version`/`migrate` (not a 2nd migration system — that's `createVersionedStore` for plain values). Files: `src/foundation/storage/zustand/{ZustandPersist,index}.ts` + `zustandPersist.test.ts` (5). Wired: explicit tsup entry + `package.json` export (nested subpath, like `forms-engine/tanstack`).
- **`useAutosave` hook (`foundation/hooks`)** — the storage-v2 "autosave" bullet. Debounced save (`delayMs`, default 800) · `idle/pending/saving/saved/error` status + `lastSavedAt` · `flush`/`cancel` · async stale-run guard (`runIdRef`) · **unmount-flush** of a pending save via a dedicated `pendingRef` (React runs the debounce effect's cleanup before the unmount cleanup, so it nulls `timerRef` first — `pendingRef` is the survivable latch). `tests/unit/foundation/hooks/useAutosave/useAutosave.test.ts` (12).

## Done (prior session — v0.1 organize + vector improvements)

- **v0.1 organize (iters 1–7)**: repo restructure (package → `engineering/codebase/`, `src/` source-only + `tests/{unit,stories}`) · docs → `engineering/{architecture,planning}` · component catalog · vector registry · `Guid` + `Page`/`TokenPage` contracts (`foundation/identifiers`, `foundation/http`) · forms → conventions (`forms.md` entities+controls) · analysis→tasks backlog.
- **Vector improvements** (shipped, mostly committed): query pagination helpers (`byPageToken`/`pageItems`) · z-index (nav progress → `z-toast`) · motion (lib-wide `prefers-reduced-motion` reset) · `compareStrings` locale collator (adopted in DataTable) · **Toaster batch-7**: `update` · dedup-by-`key` · `promise` · `content` · `onDismiss` · **i18n foundation** (`foundation/i18n`: `LocaleProvider`/`useLocale` + `useLocaleFormatters` cached `Intl` + `FormattedRelative`).

## Remaining (prioritized)

1. **Commit the uncommitted work** (owner does the git — this session's 4 vectors + prior staged i18n/Toaster; all green).
2. **v0.1 iter 8 — global-state swappable module** (owner-approved): house contract + `zustand`/`redux` optional-peer adapters, forms-engine-style. **Design pass first.** (Note: the `foundation/storage/zustand` persist adapter is now shipped — a reference for the structural-mirror / zero-dep peer approach.)
3. **Deferred (v0.1)**: 2b content-audit (delete stale `enum-alignment` decision doc — first confirm its 16-enum registry is in `conventions/…/enums.md` — + split analyses → conventions) · codify the derived-catalog pattern in `sdk-structure.md`.
4. **Vector tails** (biggest first): **i18n string-extraction** (~150–200 hardcoded strings → `t(key,vars,fallback)` + per-component `labels`; the provider/formatter layer is now real) · **component-standardization** (dual-doc `.standard.md`+`.spec.md` × 231; only 4 done) · **a11y burn-down** (72 axe-violating stories → flip `a11y.test` `'todo'`→`'error'`; adopt `RovingFocusGroup` in Checkbox/Radio/ToggleButton groups; RTL sweep) · **Toaster** (exit-ghost bug documented in its stories · stacking/expand-on-hover · swipe — **need a browser/preview session**) · **Motion FLIP** (`useFlip`/`<AnimatedLayout>` — visual) · **selection/sort** deeper canonize · **density/size** (owner deferred — needs live preview).

## Gotchas (cost real time this session)

- **`guard-git.py` hook BLOCKS agent `git commit`/`git push`** — it activated mid-session. Agents **stage** (`git add`) + hand the human a one-liner `feat: …` message (no description / co-author / Claude mention); the human commits + **pushes**. NEVER push.
- **Verify current state before "building" a vector** — z-index, motion tokens, and Toaster pause/actions/`Announce` were **already built**. The SDK is more mature than the vector list implies; grep/read first, then fill the real gap.
- **Shell is zsh**: `$var` does NOT word-split (use `${(f)var}` newline-split / `${=var}` word-split); `$PIPESTATUS` → `$pipestatus[1]`; a `cmd | tail` **masks the exit code** — capture `$?` without the pipe, or the failure hides.
- **cold-cache vite flake** (`Cannot read properties of null (reading 'useId')`) — transient dep-optimization race after a structural change; re-run (`pnpm test || pnpm test`). Documented in `../architecture/testing.md`.
- `CLAUDE.md` is at the **repo root**, not the package dir. `@src/*` alias resolves tests → source. Vitest path filters are substring matches.
- Adopting a new `foundation/{slice}/` subpath needs 4 edits: barrel · `tsup.config.ts` `subpathLayer` · `package.json` `exports` · `vitest.config.ts` unit `include` glob.

## Working rules

- **Never** commit/push (hook-enforced). Stage + draft the message. Other chats share this tree — the conventions lane had 2 in-flight files (`conventions/…/architecture.md`, `models.md`); stay out of unfamiliar changes.
- Verify green between steps: scoped test per capability (`pnpm exec vitest run --project storybook <path>`), full suite at milestones.
- Super-compact response style (`.claude/rules/response-style.md`). Docs-only changes aren't browser-observable — skip preview; the vitest storybook project renders interactions headlessly.
