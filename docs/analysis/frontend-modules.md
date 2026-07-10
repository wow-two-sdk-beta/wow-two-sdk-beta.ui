# Frontend modules — synthesis (next SDK layers)

*Last updated: 2026-07-10*

> Synthesis of the two module gap analyses. Read those for evidence:
> - [`frontend-modules-products.md`](./frontend-modules-products.md) — what 7 real product frontends hand-roll (file:line evidence)
> - [`frontend-modules-ecosystem.md`](./frontend-modules-ecosystem.md) — ecosystem benchmark vs `targets.md` verdicts

## Converged ranking

Both analyses independently ranked, product-evidence weighted (a module N products already hand-roll = proven demand, migration = deletion):

| # | Module | Product evidence | Ecosystem rank | Size | Wave |
|---|---|---|---|---|---|
| 1 | `foundation/http` **api-client** (`createApiClient`: envelope unwrap, `ProblemDetails`→`ApiError`, bearer/cookie, 401 hook) | 5 products, ~640 dup LOC; secrets-vault = verbatim drydock copy | conflicts §9 lock — see below | M | **1** |
| 2 | `auth` session module (me-resolve → gate → signIn/out; OAuth redirect / bearer / cookie+guest+Google strategies) | drydock · secrets-vault · smart-qr | E#1 | L | **1** |
| 3 | `query` **optimistic mutation** | smart-qr + drydock work around passive-only query | — (gap in shipped module) | S/M | **1** |
| 4 | **feedback bus** (`notify()` + query-error→`Toaster` bridge) | 0 products wired toasts; transcript-forge left a TODO | E#8 (notification store) | S/M | **1** |
| 5 | `forms` form-state glue (values/errors/submitting + `ApiError`→field errors; TanStack Form wrap per E) | 4 products; smart-qr ~20 `useState` fields | E#2 | M/L | 2 |
| 6 | `foundation/config` typed env (`defineConfig(schema)` over `import.meta.env` + `window.__APP_CONFIG__`) | 3 products raw | E#7 | S | 2 |
| 7 | `foundation/storage` v2 (versioned keys, migrations, zustand-persist adapter, autosave) | prism ~400 LOC · 3 more products | — | M | 2 |
| 8 | `commands`/shortcuts registry (typing-guard, scopes; renders into `CommandPalette`) | ~7 raw keydown sites (prism, whiteout) | E#5 | M | 3 |
| 9 | `foundation/files` (download/import ritual) + `foundation/format` (durations incl. C# `TimeSpan`, currency, truncate) | transcript-forge, prism; zone-builder next | — | S+S | 3 |
| 10 | `analytics` typed event bus (+ settles `targets.md` §10.9 naming) · `flags` (OpenFeature-shaped) | none yet (greenfield) | E#3 · E#4 | S/M | 3 |

Deferred from both: `errors` extraction (E#6, promote when touched) · `AppDevtools` (E#10) · uploadQueue (E#9, until a consumer needs it) · i18n (already locked NEXT in `targets.md` §2.2 — biggest single gap, separate track).

## Wave 1 status (2026-07-10)

- **`createApiClient` SHIPPED** — `foundation/http` (54 tests; envelope unwrap default-on, transport retry default-off, bearer delegate, 401 hook, `fieldErrors`, Temporal opt-in, abort-native). §9 lock revised in practice: backend-contract client, not a generic wrapper.
- **Integration direction decided** — [`http-query-integration.md`](./http-query-integration.md): app-local endpoint factories `{key, queryFn}` + a tiny `defineEndpoint` typing core in `/query` (build next); OpenAPI = phase-3 types-only feed.
- **Lib adoption verdicts** — [`lib-adoption.md`](./lib-adoption.md): TanStack Form → `/forms-engine` (Wave 2) · react-virtual internal · pragmatic-drag-and-drop over dnd-kit (§10.2 flip) · TanStack Table + Recharts as §8 companions · swap `@js-temporal/polyfill` → `temporal-polyfill` 1.0 (drop-in, shipped-dep health).
- **2026-07-10 (later):** client hardened per owner review — body-driven empties (empty→`undefined`, literal `null`→`null`, bodied 204 parses) + swappable `ResponseEnvelope` (`wowTwoEnvelope` default · `rawEnvelope` · custom); `defineEndpoint` shipped in `/query` (3-LOC core, spreads into all hooks); **`/auth` module shipped** (`AuthProvider`/`useAuth` machine, cookie/bearer/redirect strategies matching drydock·secrets-vault·smart-qr, `createAuthBridge` wiring `onUnauthorized`+`requireAuth`); `temporal-polyfill` swap done; `targets.md` doc-debt synced. Suite 1423 green.
- Next: optimistic mutation (`/query`) → feedback bus → then Wave 2 (forms engine, config, storage v2).

## The §9 lock decision (user call required)

`targets.md` §9 locks out "Networking — fetch wrappers (consumer's data lib)". Product evidence: **every product hand-rolls exactly this**, duplicating wow-two-backend-specific logic (result envelope, `ProblemDetails` mapping — the client half of the backend SDK contract, not a generic fetch wrapper). Recommendation: **revise the lock** — permit a backend-contract client in `foundation/http` (transport still native fetch, no axios-style general wrapper). Same doc-debt family as the stale §2.8/§3.8 router/query verdicts (SDK now ships both).

## Instant win (no SDK work)

transcript-forge deletes ~830 vendored LOC by adopting the shipped `/query` + `foundation/resilience` (it already runs the SDK router).

## Doc debt to sync (when Wave 1 starts)

`targets.md`: §2.8/§3.22 + §3.8 router/query wording stale · §2.21/§2.22 reality ahead of verdicts · §8 lacks the subpath-with-optional-peer pattern (the actual vehicle for infra modules — see `package.json` `peerDependenciesMeta`).
