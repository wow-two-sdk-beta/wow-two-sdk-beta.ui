# Pagination response model — composable interfaces

*Last updated: 2026-07-11*

Design for the paginated-response shape `@wow-two-beta/ui` ships: not one monolithic `PageDto`, but a set of small single-concern interfaces that concrete page types compose. Grounded in the current query hooks, the real product/backend contracts (every one read + cited below), and the frontend/backend model conventions. Owner intent: page size, cursor/token, total count, and optional query timing are each their own composable; `Page<T>` (offset) and `TokenPage<T>` (cursor) are built from them.

**Naming decided (owner 2026-07-11) — rework the tables below to this when built (v0.1 iter 5):** use the **`IHas*`** interface prefix (`IHasPageSize`, `IHasTotalCount`, `IHasQueryTiming`, …). The token composable is **generic**: `IHasPageToken<TToken>` (default `TToken = string`) — so a token may be `string`, `number`, an id, or any opaque cursor type. `TokenPage<T, TToken>` carries it through.

---

## 1. Current state

### 1a. What the query hooks assume today

The two paging hooks are **fully generic over the page shape** — the SDK ships no page model; `TPage` is whatever the app hands in.

- `useAppPaginatedQuery<TItem, TPage>` (`src/query/UseAppPaginatedQuery.ts`): `queryFn` returns `Promise<TPage>` (`:15`), `mapPage?: (page: TPage) => readonly TItem[]` extracts items — "the page itself is the item array when omitted" (`:21`). The M5 fix surfaced the raw page: `page: query.data` (`:58`), typed `TPage | undefined`, with the comment "total count / page count / `hasMore` live here" (`:55-57`). So totals are **reachable but un-modelled** — the app defines their names.
- `useAppInfiniteQuery<TItem, TPage>` (`src/query/UseAppInfiniteQuery.ts`): cursor-style — `getNextPageParam: (lastPage: TPage, allPages) => unknown` (`:17-18`) and `initialPageParam: unknown`. The next-page key is `unknown`; the hook never names a token field.
- `TPage` is **app-defined, never SDK-defined.** The only concrete page shapes in the repo are test fixtures: `interface Page { readonly rows: string[] }` (`UseAppPaginatedQuery.test.tsx:20`) and `interface CountedPage { rows; total }` (`:83`) — the latter exists purely to prove `result.page?.total` stays reachable.

### 1b. The envelope does NOT model pages

- `ApiResponse<T> = { data: T }` (`src/foundation/http/ApiResponse.ts:2`) — success wrapper only. `wowTwoEnvelope.unwrap` strips `.data` (`Envelope.ts:34`); the client returns the inner `T` (here `TPage`). `ProblemDetails` is the error channel. **No page/paged/cursor/offset/totalCount type exists anywhere in `src/`** (grep-confirmed — only the UI `presentation/nav/pagination/Pagination.tsx` component, unrelated, and the test fixtures).

### 1c. Real product + backend shapes — nobody paginates yet

Every list endpoint across all three products returns a **plain, unpaged array** wrapped in `ApiResponse<T>`. Evidence:

| Product | Frontend consume | Backend return | File |
|---|---|---|---|
| drydock | `listServers(): Promise<ServerDto[]>` · `listProducts(): Promise<ProductDto[]>` | `ApiResponse<IReadOnlyList<ServerDto>>` · `…<ProductDto>>` | `…/src/api/client.ts:111,124` · `ServersController.cs:20` · `ProductsController.cs:24` |
| secrets-vault | `searchSecrets({ns?,key?}): Promise<SecretDto[]>` · `listNamespaces()` · `listTokens()` | `ApiResponse<IReadOnlyList<SecretDto>>` · `…<NamespaceDto>>` · `…<TokenDto>>` | `…/src/api/client.ts:136,161,174` · `SearchSecretsResult.cs` · `ListNamespacesResult.cs` |
| smart-qr | (codes list) | `ApiResponse<IReadOnlyList<CodeDto>>` | `CodesController.cs:89` · `CodeListResult.cs:9` |

Findings:
- **Paradigm today: neither offset nor cursor — unbounded arrays.** No `Skip`/`Take`, no `pageSize`, no `totalCount`, no cursor/token in any of the 94 (drydock) / 195 (smart-qr) / 109 (secrets-vault) `.cs` files, nor in the frontend `types.ts`. `searchSecrets` is the closest to a list query and it carries only **filter** params (`ns`, `key`), no paging.
- **The one `limit`** is drydock's GitHub-releases passthrough `GetReleasesAsync(string repo, int limit, …)` (`FakeGitHubClient.cs:46`) — a proxy to GitHub's own API, not a first-class wow-two paged contract (no total, no cursor).
- The **backend SDK** (`wow-two-sdk.backend.beta`) also ships **no paged type** — greenfield on both sides of the wire.

**Consequence:** this is a clean-slate contract, not a retrofit. Zero existing consumers constrain the shape — the design defines the paradigm rather than mirroring one. Products will add pagination as list sizes grow (codes, secrets, audit logs); the SDK should have the shape waiting (SDK doctrine: build the whole vector before the product needs it).

### 1d. What the conventions already fix

The naming is half-decided before we start:

- `frontend/code-style/models.md:25` — "a **read** returns its `*Dto` directly; **`*Response` is reserved for a genuine wrapper (paging)**, never a plain entity read." → the paged wrapper is the sanctioned exception to bare-Dto reads.
- `models.md:21` — the **request** side is already named: **`{Noun}QueryDto`** ("the search + paging params a list read takes", e.g. `CodesQueryDto`) and the light row projection is **`{Noun}RowDto`** (`:20`). This doc designs only the **response** wrapper — the request/query-params model is out of scope and already conventioned.
- `backend/presentation/response-models.md:62` — "**no metadata** — pagination / status / timestamps that aren't entity fields don't go in the DTO or the envelope." → pagination metadata belongs **neither** on the entity DTO **nor** in `ApiResponse`. It must live in a **dedicated wrapper that is itself the `T`**: `ApiResponse<Page<CodeRowDto>>`. That wrapper is exactly what this doc models on the frontend.
- `architecture/state-and-data.md:72` — the two paradigms are **already declared**: "`useAppInfiniteQuery` (**cursor** + poll-while-running) · `useAppPaginatedQuery` (**page/offset**, keep-previous)". The composables must serve both; the concrete types map 1:1 onto these two hooks.
- `code-style/type-mapping.md` — scalar contract for fields: `int → number`, `IReadOnlyList<T> → ReadonlyArray<T>`, nullable `T? → field?: T` (never `| null`, never emit null).

---

## 2. Proposed composable interfaces

Nine single-concern fragments. Each names one capability of a page; concrete types `extends` the subset they carry. Bare `interface`, one blank line between documented members (`models.md:58`), fields typed per `type-mapping.md`.

| Interface | Single concern | Field(s) | Paradigm |
|---|---|---|---|
| `WithItems<T>` | the page's rows | `items: ReadonlyArray<T>` | both (universal) |
| `WithPageSize` | effective page size | `pageSize: number` | both |
| `WithPageNumber` | 1-based page index echo | `pageNumber: number` | offset |
| `WithOffset` | raw skip/limit echo (alt encoding) | `offset: number` | offset |
| `WithTotalCount` | total matching rows, all pages | `totalCount: number` | offset |
| `WithPageToken` | opaque forward continuation | `nextPageToken?: string` | cursor/token |
| `WithHasMore` | explicit "another page exists" flag | `hasMore: boolean` | both (opt) |
| `WithQueryTiming` | server-side query elapsed (diagnostics) | `queryElapsedMs?: number` | both (opt) |
| `WithAppliedQuery<TQuery>` | echo of the applied filter/sort/paging | `appliedQuery?: TQuery` | both (opt) |

Notes on the set:
- **`WithItems<T>` uses `items`, not `data`** — `data` is the envelope's word (`ApiResponse<T>.data`), reusing it inside the wrapper would double-nest the term. `items` also matches the hook's `TItem` vocabulary.
- **Offset family has two encodings** — `WithPageNumber` (1-based, matches the `Pagination` UI component's `page` prop and `useAppPaginatedQuery`'s controlled `page`) is canonical; `WithOffset` (`offset`, i.e. skip) is the sibling for skip/take backends. A page composes one, not both.
- **`WithPageToken.nextPageToken` is optional** — its **absence marks the last page** (the cursor paradigm's natural terminator). `WithHasMore` is only needed when a backend also sends an explicit flag; otherwise has-more is derived (`nextPageToken !== undefined` for token pages; `pageNumber * pageSize < totalCount` for offset pages).
- **`hasMore` is the field, `WithHasMore` is the interface** — this is the coherent pair with the `naming.md` convention: the boolean **field** takes the `has*` prefix (`hasMore`), the composable **interface** takes the `With*` prefix. The two conventions cooperate rather than collide (see §5).
- **`WithQueryTiming`** is the owner's explicit "some screens need query timing" case — kept a separate optional fragment so a page carries it only where a screen renders it.
- **`WithAppliedQuery<TQuery>`** closes the loop with the request model: `TQuery` is the product's `{Noun}QueryDto` (`models.md:21`), echoed so the UI can render "showing results for …" without re-deriving from local state. Optional and stretch — include only when a screen needs the echo.

---

## 3. Concrete page types

Two named types — one per paradigm — plus intersection for opt-in fragments. Generic, bare-named (no `Dto` — see §5).

```typescript
/** Defines an offset/page-indexed slice of a list read — the shape `useAppPaginatedQuery` binds `TPage` to. */
export interface Page<T> extends WithItems<T>, WithPageNumber, WithPageSize, WithTotalCount {}

/** Defines a cursor/token slice of a list read — the shape `useAppInfiniteQuery` binds `TPage` to. */
export interface TokenPage<T> extends WithItems<T>, WithPageToken, WithPageSize {}
```

- **`Page<T>`** — offset paradigm. `totalCount` lets the UI compute total pages + drive the `Pagination` component; has-more is derivable, so `WithHasMore` is added only when the backend sends it. A skip/take backend swaps `WithPageNumber` for `WithOffset`.
- **`TokenPage<T>`** — cursor/token paradigm. No `totalCount` (keyset scans usually can't cheaply count); `getNextPageParam` reads `nextPageToken`. **`CursorPage<T>` is a documented alias, not a distinct type** — "cursor" and "token" are the same keyset-forward paradigm for the client (an opaque string you echo back). A Relay-style per-edge-cursor connection is a different shape (`CursorConnection<T>`) and is out of scope — note it as a future addition if a backend ever emits edges.
- **Opt-in fragments compose by intersection, no new named type** — a screen that needs timing types its page as `Page<T> & WithQueryTiming`; one that needs the filter echo uses `Page<T> & WithAppliedQuery<CodesQueryDto>`. This is the payoff of small interfaces: the SDK ships two nouns and the fragments, and screens assemble the exact shape they consume without the SDK enumerating a `TimedPage`/`FilteredPage`/`TimedFilteredPage` combinatorial zoo.

```typescript
// Product usage — the T is where the *Dto suffix lives (models.md), the wrapper stays generic:
type CodesPage = Page<CodeRowDto>;                       // offset list
type CodeFeedPage = TokenPage<CodeRowDto>;               // infinite feed
type AuditPage = Page<AuditRowDto> & WithQueryTiming;    // screen that shows "query took Nms"
```

---

## 4. Hook typing — SDK ships the contract, hooks stay generic

**Verdict: the SDK ships the composables + concrete types (types only); the hooks keep their `TPage` generic and gain optional ergonomic helpers.** Fully additive, no signature change.

- **`useAppPaginatedQuery`** — a product sets `TPage = Page<CodeRowDto>`. The already-shipped `page: query.data` return is now typed `Page<CodeRowDto> | undefined`, so `result.page?.totalCount` / `?.pageNumber` are typed instead of app-invented. `mapPage` becomes `p => p.items`.
- **`useAppInfiniteQuery`** — `TPage = TokenPage<CodeRowDto>`; `getNextPageParam = last => last.nextPageToken` (typed `string | undefined` — undefined stops), `mapPage = p => p.items`.
- **Why not hard-wire `Page<T>` into the hooks?** The hooks are the general mechanism (keep-previous, poll-while-running, `AbortSignal`, error coercion) and must still accept a bare-array or bespoke page. Constraining `TPage extends WithItems<T>` would break the "page itself is the item array when omitted" default and forbid non-conforming backends. Keep the shape **opt-in**, mechanism **generic**.
- **Optional ergonomic follow-ups (separate pass, not required):**
  - A constrained overload — when `TPage extends WithItems<TItem>`, default `mapPage` to `p => p.items` so conforming products omit it entirely.
  - Tiny helpers colocated with the model: `byPageToken<T>()` → a ready `getNextPageParam` for `TokenPage<T>`; `pageParamOf(pageNumber)` for the offset hook. Ships the paradigm end-to-end without products re-writing the boilerplate.

---

## 5. Naming + location verdict

### Interface prefix — `With*`

**Use the `With*` prefix for the composable interfaces; concrete types are bare nouns.**

- **`With*` over `Has*`** — `naming.md` reserves `has*` (camelCase) for a standalone **boolean field/prop** (`hasError`, `hasIcon`). `WithHasMore { hasMore: boolean }` shows the split working: `With*` = the composable **interface**, `has*` = the boolean **field** it carries. Naming the interface `HasMore`/`HasTotalCount` would blur the two categories on a skim. `With*` is the recognized TS mixin/trait idiom and collides with nothing.
- **`With*` over noun (`PageSize`, `TotalCount`)** — a bare noun reads as a scalar alias (`type PageSize = number`), not "a shape carrying that field." `With*` unambiguously names a fragment you compose.
- **Concrete types stay bare (`Page`, `TokenPage`) — no `*Dto`.** The `*Dto` suffix is a **product-entity** rule (`models.md:14`); the SDK's own foundation contracts are already bare — `ApiResponse<T>`, `ProblemDetails`, `ResponseEnvelope` carry no `Dto`. `Page<T>`/`TokenPage<T>` are generic SDK wire contracts of that same family, so they match it. The `*Dto` lands on the `T` a product plugs in (`Page<CodeRowDto>`), which is exactly where the convention wants it. This also honors `models.md:25` — the paged wrapper is the sanctioned non-`*Dto` read shape.

### Location — `src/foundation/http/Page.ts`

**One file, `foundation/http/Page.ts`, holding the composables + both concrete types; exported through the existing `foundation/http/index.ts` barrel.**

- **`foundation/http/`, alongside `ApiResponse`** — a page is a wire-contract shape in the same family as the envelope it rides inside (`ApiResponse<Page<T>>`). Same layer, same concern. Not `domain/` — that layer holds UI domains (`color`, `emoji`), not HTTP contracts. Not a new top-level `pagination/` slice — nine tiny interfaces + two types are a cohesive family, not a feature slice with hooks/components (over-structuring).
- **One file, not one-per-interface** — `models.md:34` "group tight: a cohesive family used together → one file." The composables are never used apart from the page types; splitting into nine files would be the C#/assembly one-type-per-file rule that TS has no reason to import. File named `Page.ts` after its primary export (`naming.md` file-matches-export).
- **No clash with the `Pagination` UI component** — `presentation/nav/pagination/Pagination.tsx` is a different layer + folder; centering this file on `Page` (not the word `Pagination`) keeps the import surfaces unambiguous.
- **Barrel** — add to `src/foundation/http/index.ts` (which already re-exports `ApiResponse`, `ProblemDetails`, `Envelope`, …), so consumers pull `Page`/`TokenPage`/`With*` from `@wow-two-beta/ui/foundation/http` next to the envelope.

---

## 6. Migration note

**Fully additive — no breaking change, zero migration.**

- The shipped `page: query.data` raw access (M5 fix, `UseAppPaginatedQuery.ts:58`) is **untouched**. It already returns the raw `TPage`; this design just gives products a typed shape to bind `TPage` to. `result.page?.totalCount` goes from "app-invented field on an app-defined interface" to "SDK-typed field on `Page<T>`" — same runtime, better types.
- **No product paginates today** (§1c), so there are **no consumers to migrate**. The SDK gains new type-only exports; every existing generic `TPage` call site compiles unchanged (bare-array pages, test fixtures, and future bespoke shapes all still satisfy the un-constrained `TPage`).
- **Backend alignment is forward-only** — when a product first paginates, its backend returns `ApiResponse<Page<CodeRowDto>>` (the wrapper `T` that `response-models.md:62` mandates for pagination metadata), the `.NET` side mirrors these fields (camelCase per `type-mapping.md`), and the frontend binds `TPage = Page<CodeRowDto>`. The `WoW2.Sdk.Backend.Beta` should grow the symmetric `Page<T>`/`PagedResult<T>` record in the same pass (currently absent) so both sides of the wire share one contract.
- **Optional later** — the constrained-`mapPage` overload and `byPageToken`/`pageParamOf` helpers (§4) are a separate ergonomic pass; nothing here depends on them.
