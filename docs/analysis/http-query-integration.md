# http ↔ query integration — the endpoint layer

*Last updated: 2026-07-10*

> **Question**: with `foundation/http`'s api-client (transport, [products #1](./frontend-modules-products.md), Wave 1) below and `/query` (state) above, what is the house pattern for the layer between — how apps declare typed endpoints and get query/mutation hooks?
>
> Evidence: `src/query/` (hooks take `{ key, queryFn }`, not raw RQ options; app-local `queryKeys` registry per barrel header) · `src/foundation/http/` (today: contract only — `ApiError`, `ApiResponse`, `ProblemDetails`, brands, temporal reviver) · `src/router/Paths.ts` (the sibling precedent: SDK ships generic `definePath` core, app owns the `paths` registry) · product audits in [frontend-modules-products.md](./frontend-modules-products.md) · `conventions/development/frontend/architecture/state-and-data.md` (endpoint-object client shape + `queryKeys`↔`paths` interlock already documented).
>
> Presupposes the [§9 lock revision](./frontend-modules.md) permitting the backend-contract client — this doc doesn't relitigate it.

## Constraints that shape the answer

- **Optional-peer isolation** — `@tanstack/react-query` exists only inside `/query`; the client must stay usable without RQ (imperative calls, non-RQ apps). So any helper that *pairs* keys with fetchers lives in `/query`, never in `foundation/http`.
- **The seam is already shaped.** `useAppQuery.queryFn: (ctx: { signal }) => Promise<TRaw>` and the client's `get(url, { signal }): Promise<T>` are signal-for-signal compatible; the client throws `ApiError`, and `toApiError` passes `instanceof ApiError` through untouched. Transport→state integration needs **zero adapter code** — only a declaration convention.
- **Beta-forever + zero-cost-for-new-products** — a new product should get typed data hooks by writing one small file per resource, no build step, no generator.
- **Router precedent** (`Paths.ts`): SDK ships a ~40-LOC generic builder with type inference; the registry itself is app-local and never exported by the SDK. `queryKeys` is already documented as "the data-layer `paths`".
- **Backend emits OpenAPI** (verified in source, not just docs): `wow-two-sdk.backend.beta` ships first-party `Microsoft.AspNetCore.OpenApi` 10.0.3 — `AddOpenApiDefaults()` + `MapOpenApiEndpoint()` at `/openapi/{documentName}.json`, wired inside the meta `AddApiDefaults()` and exposed when `ExposeOpenApi ?? IsDevelopment()`. The document exists for every conformant product; **no codegen tooling exists anywhere frontend-side today** (no orval/hey-api/openapi-fetch/ts-rest in any repo or doc).

## Options

Migration cost is for the 5 API products: drydock, secrets-vault, smart-qr, transcript-forge, arcade.

| | DX | Type-safety | Migration cost (5 products) | Lock-in |
|---|---|---|---|---|
| **A. Manual composition** (status quo) — inline `queryFn: () => api.get<T>('/api/…')` per hook call + separate `queryKeys` registry | Poor at scale: key + URL + response type re-stated at every call site; prefetch/cache sites re-pair key↔fn by hand | Weak — `<T>` asserted per call site; nothing stops `queryKeys.codes.list` being paired with the servers fetcher | Zero (it's the default drift) | None |
| **B. Endpoint-object convention** (drydock style, codified — already the letter of `state-and-data.md` §Client shape) — app declares `const api = { listCodes: (signal) => client.get<CodeDto[]>(…) }`; SDK ships nothing | Good: URL + response type stated once per endpoint; hooks stay one-liners | Good for the fetch itself; key↔fn pairing still manual and uncheckable — the one drift A and B share | Near-zero — drydock/secrets-vault already there; smart-qr's per-endpoint fns fold into an object; arcade greenfield | None |
| **C. Endpoint/query factories** — app-local per-resource factories returning `{ key, queryFn }` (key + fetcher typed **once**, together); SDK ships only a `defineEndpoint` typing core in `/query` (the data-layer `definePath`) | Best without codegen: one def spreads into `useAppQuery` / `usePrefetchQuery` / `useQueryCache` — key and fn can never desync; TanStack v5's canonical `queryOptions` pattern, house-shaped | Strong: `TRaw` inferred from the client call and carried by the def everywhere the endpoint is touched | Low + mechanical — piggybacks on the already-scheduled `/query` adoption of drydock/secrets-vault/smart-qr; transcript-forge just co-locates its existing `queryKeys` + `Api.ts`; arcade day-one | Tiny — a def is a plain `{ key, queryFn }` object; deleting the helper leaves valid code |
| **D. Contract/codegen** — OpenAPI generators (openapi-fetch/orval/hey-api) or hand-written runtime contracts (ts-rest/zodios) against the backend's `/openapi/v1.json` | Best at steady state, worst at setup: build step, generated churn, per-product wiring; runtime-contract flavors force hand-duplicating DTOs the .NET backend already owns | Strongest — types derived from the backend, drift caught at generation | High — toolchain + regenerate discipline × 5 products; full-client generators also bypass `foundation/http` (second transport, or middleware re-implementing envelope/temporal/ApiError semantics) | High — generator dialect + build-step dependency; friction-shaped wrong for beta-forever fix-forward |

## Recommendation — C over B: app-local query factories, SDK ships only `defineEndpoint`

**B is the client-declaration convention (keep it); C is what the query layer consumes.** Codify per-resource factories that fuse the endpoint object and the `queryKeys` entry for reads; mutations stay plain client calls fed to `useAppMutation`. The SDK ships one tiny typing helper in `/query` — mirroring exactly how the router solved the same problem (`definePath` core in SDK, `paths` registry in the app).

```ts
// app-local: src/integration/codes/CodesApi.ts — one file per resource
export const codesApi = {
  keys: {
    all: ['codes'] as const,
    list: (q?: string) => ['codes', 'list', q ?? ''] as const,
    detail: (id: string) => ['codes', id] as const,
  },
  list: (q?: string) => defineEndpoint({
    key: codesApi.keys.list(q),
    queryFn: ({ signal }) => client.get<CodeDto[]>(`/api/codes${toQuery({ q })}`, { signal }),
  }),
  create: (req: CreateCodeRequest) => client.post<CodeDto>('/api/codes', req),
};

// call sites — the def spreads into every key-consuming surface
const { data } = useAppQuery({ ...codesApi.list(q), map: toCode });
usePrefetchQuery(codesApi.detail(id));
const create = useAppMutation({ mutationFn: codesApi.create, invalidates: () => [codesApi.keys.all] });
```

Why C wins:

- **Kills the only drift B leaves open.** `usePrefetchQuery`, `useAppSuspenseQuery`, `useQueryCache`, persistence and the coming optimistic-mutation module all consume keys — with A/B every such site re-pairs key↔fn by hand. Factories make the pairing a single source of truth, which is precisely the failure mode the router's `paths` registry eliminated for `to=` strings.
- **Zero machinery beyond typing.** House hooks already accept `{ key, queryFn }` — defs spread in with **no changes to `/query` hook signatures**. `defineEndpoint` is ~15 LOC of inference (constrain the shape, flow `TRaw`), the same weight class as `definePath`.
- **Respects the peer boundary.** The client stays RQ-free transport; the helper sits in `/query` where the RQ peer is guaranteed; non-RQ consumers keep using the bare client / endpoint objects.
- **Codegen-ready without codegen.** When D-lite arrives (below), only the DTO type imports inside factories change — call sites don't move. Factories are the stable membrane between hand-written today and generated tomorrow.

D is rejected *as the integration pattern* but not forever — see phase 3. Full-client generation stays rejected: it would either bypass `foundation/http` (two transports) or re-implement its envelope/temporal/ApiError semantics as middleware, and its build-step + churn profile fights the beta-forever velocity play.

## What ships in SDK vs stays app-local

| Where | What |
|---|---|
| SDK `foundation/http` | `createApiClient` (Wave 1 as planned): envelope unwrap, ProblemDetails→`ApiError`, temporal reviver, bearer/cookie, 401 hook. **No RQ knowledge; no key concepts.** Its `{ signal }` option *is* the query seam. |
| SDK `/query` | `defineEndpoint` (typing core) + exported `Endpoint<TRaw>`/`EndpointFn` types; guarantee-by-test that every key-consuming hook spread-accepts a def. Nothing else new. |
| SDK docs / conventions | Update `state-and-data.md` §Client shape + §Query layer: per-resource factory file (`src/integration/{resource}/{Resource}Api.ts`), `keys` sub-registry co-located, mutations as plain fns. Registry stays **app-local and unexported** — same sentence the `/query` barrel already carries for `queryKeys`. |
| App-local | The factories themselves · key hierarchies (invalidation granularity is a product decision) · DTO types (until phase 3) · DTO→domain `map` fns · `use{Resource}` hooks per `hooks.md` where a resource earns one. |

## Phased path

1. **Now (with the Wave-1 api-client build):** ship `createApiClient` RQ-free; add `defineEndpoint` to `/query` (shipped — see below); update `state-and-data.md`; stamp the pattern into arcade (greenfield proof) and transcript-forge (already on house hooks — co-locate its `queryKeys` + `Api.ts` into factories while deleting the vendored layer).
2. **With scheduled `/query` adoption (drydock · secrets-vault · smart-qr):** migrate their endpoint objects/fns into factories as each product moves onto house hooks — one mechanical pass per product, no separate migration. Wave-1 optimistic-mutation and feedback-bus modules consume the same defs/keys untouched.
3. **After codegen exists (trigger: DTO drift actually bites, or product count makes hand-typed DTOs the bottleneck):** adopt **types-only** generation (`openapi-typescript` shape) against the backend SDK's `/openapi/v1.json` — generated `.d.ts` checked in, regenerated on demand, no runtime artifact. Factories keep their shape; only type imports swap. Re-evaluate full-client generation only if types-only proves insufficient — it is not on the current path.

## Shipped — `defineEndpoint` (phase 1, SDK side · 2026-07-10)

`src/query/Endpoints.ts`, barrel-exported: `defineEndpoint({ key, queryFn })` → `Endpoint<TRaw>` (identity at runtime — 3 LOC) plus `Endpoint<TRaw>` / `EndpointFn<TArgs, TRaw>` for registry annotations. Zero hook-signature changes. Spread guarantee by test (`Endpoints.test.ts` node · `Endpoints.browser.test.ts` chromium): a def spreads into `useAppQuery` / `useAppSuspenseQuery` / `useAppLazyQuery` options, feeds `usePrefetchQuery` / `prefetchProps` / `useQueryCache().prefetch` whole, and pairs with a bare `QueryClient` (`fetchQuery({ queryKey: def.key, queryFn: def.queryFn })`).

Usage is exactly the sketch above; two notes:

- **Parameterized endpoints are factories** — `detail: (id: string) => defineEndpoint({ key: keys.detail(id), queryFn: … })`; `EndpointFn<[id: string], CodeDto>` names that shape when a registry wants the explicit annotation.
- **Identity reads state `TData`.** `useAppQuery({ ...def })` with no `map` infers `data: unknown` — `TData` only infers from `map` and the hooks were deliberately untouched. Write `useAppQuery<CodeDto[]>({ ...def })` or pass a `map`; prefetch/cache surfaces take defs whole, no generics needed.

Rest of phase 1 still open: `createApiClient`, `state-and-data.md` update (§Client shape factory-file convention + capability-matrix row), arcade / transcript-forge stampings.
