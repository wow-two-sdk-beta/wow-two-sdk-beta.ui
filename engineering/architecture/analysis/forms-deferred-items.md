# Forms engine — the 3 deferred architectural items

*Last updated: 2026-07-11*

> Deep-dive on the three architectural items [`forms-vector-next.md` §F-2h](./forms-vector-next.md#f-2h-contract-backlog-seeded-by-f-2def--2026-07-11) marked **deferred — architectural** (documented, not blocking maturity). The engine is mature: two adapters (`house`, `tanstack`), 94-case conformance, all `AppForm` members wired, three product proofs (drydock, secrets-vault simple tier · smart-qr stress). These are the remaining hard problems — grounded in the shipped code (`src/forms-engine/**`) and the smart-qr F-2g strains, not generic form-library advice.
>
> Reads: `AppForm.ts` (contract) · `FormGlue.tsx` (engine-free `Field`/`Subscribe`) · `house/HouseFormCore.ts` · `tanstack/UseAppForm.tsx` + `TanstackFormOverlay.ts` · `Paths.ts` · `SchemaValidation.ts` · `SubmitErrors.ts` · `foundation/http/FieldErrors.ts` · smart-qr `CreateCodeForm.ts` / `ContentView.tsx` / `RuleControls.tsx`.

---

## The constraints every recommendation is scored against

Four load-bearing rules from the shipped design — an option that violates one is disqualified regardless of ergonomics:

1. **The contract is engine-free — never leak vendor types.** `AppForm.ts` imports zero engine types; the peer is ESLint-fenced to `tanstack/**` (`forms-engine.md` §4/§5). A recursive path type "borrowed from TanStack" cannot live on the shared contract — only on the `tanstack` `form.engine` escape hatch, which already exposes it.
2. **Two engines, pinned by conformance.** Anything added must be implementable in **both** `house` and `tanstack` and provable in `FormEngineContract.shared.tsx` (the anti-LCD instrument). Signatures alone aren't conformance; behavior is.
3. **`forms-engine` never imports presentation** (`FormGlue.tsx` header) — the chrome seam is the foundation `FormControlContext` alone. An SDK "error slot" can only *expose* errors via context; it cannot *render* `FormErrorMessage`.
4. **Thin-contract / escape-hatch discipline** — the contract grows only from product evidence; "2+ forms reach for the same escape → promote, else it stays a userland pattern" (`forms-engine.md` §4, §7 risk row 1).

---

## Item 1 — Per-field errors inside a discriminated-union field

### Problem + evidence

smart-qr's `content: CodeContent` is one discriminated union (10 members, keyed on `type`). It binds as **one** top-level field — the values-clean win:

```tsx
// ContentView.tsx — content bound as ONE field: f.value is the fully-typed CodeContent, zero cast
<form.Field name="content">
  {(f) => ( … <ContentTypeControls content={f.value} onChange={f.setValue} /> )}
</form.Field>
```

The sub-controls edit the **whole object** (`onChange({...value, url})` → `f.setValue`), so **no input is bound to a `content.url` form path**. A schema issue at `content.url` therefore has no field subscriber and renders nowhere. `CreateCodeForm.ts` states the trade in-code: *"Per-content-field messages are intentionally omitted … a `content.url` issue has no field subscriber to render it; content-payload validation is left to the backend, surfaced via `submitError`."*

**The decisive observation — this is not a union problem.** The same form's `rules` array proves the mechanism already works: each row cell binds a deep path `form.Field name={`rules[${i}].destination`}`, the schema `superRefine` emits at `path:["rules",index,"destination"]`, `issuePathToString` → `rules[0].destination`, and the error **renders on the right row** (`RuleControls.tsx`). The pipeline (`getPath`, `issuePathToString`, `getFieldState`, per-path merge in both adapters) is fully deep-path capable. The union field renders nothing per-leaf **only because its sub-controls chose whole-object binding**, and because the union's *active leaf set is dynamic* (which leaves exist depends on `f.value.type`). Exploding it into leaf `form.Field`s is a **consumer pattern available today with zero SDK change** — it just re-incurs the array-row cast tax (item 2) and rewrites each sub-control to per-leaf `setValue`.

### Options

| # | Option | Per-leaf inline errors? | SDK code | Both engines | Cost / catch |
|---|---|---|---|---|---|
| a | **Union explosion (userland)** — switch on `f.value.type`, render a leaf `form.Field name="content.url"` per active variant | Yes | **none** (a pattern) | already works (deep paths) | N `unknown` casts/leaf (item 2); rewrite every sub-control to per-leaf `setValue`; the `type` selector still does a whole-object reseed (`emptyContent`) |
| b | **`form.subForm(path)`** — scope a child `AppForm` to the sub-object | Routes errors, but **union typing stays `unknown`/`never`** on non-shared keys — moves the typing problem, doesn't solve it | **L** — a projection layer in *both* adapters + conformance | house projection + a tanstack nested-form bridge — heavy | Highest cost, lowest payoff; a sub-form over a union still can't type `name="url"` |
| c | **Error-routing slot** — render union-internal issues in one manually-placed slot | Whole-object slot, not per-leaf | New surface **or** free schema pattern | yes | The free variant: author the schema to emit the payload issue at `path:["content"]` (via `superRefine`) → the existing `content` field's `f.errors` renders it in one slot. **Zero SDK code.** A true `errorsAt(prefix)` selector would need a new contract surface (the error map isn't on `AppFormState`) — not worth it for one case |
| d | **Whole-object + server-side (status quo, shipped)** — content validated on the backend → `submitError` banner | No (form-level) | none | n/a | Already shipped in smart-qr; correct for payload validation (URL/email formats are server-re-validated anyway) |

### Recommendation · effort · verdict

**Keep (d) as the default forever; document (a) and the (c)-schema-emit variant as userland patterns in `docs/forms.md`.** Do **not** build an SDK abstraction. Rationale:

- The one lost capability is *per-keystroke inline validation of a content payload* — low value: URL/email/wifi payloads are exactly what the backend re-validates, and `submitError` already surfaces the failure. The single-field union is the right shape.
- A consumer who genuinely wants inline per-leaf errors can do (a) today with **no SDK code** — the rules array is the working proof. Or emit the issue at `content` for a one-slot render (c).
- The only "real" SDK build is (b) `subForm`, which is **L and doesn't even solve the union typing** it would exist to solve. Dominated.

**Effort:** document = **S**. Any abstraction = **L** (and rejected).
**Verdict: stay-deferred.** Promote to a thin `variantField` doc-helper *only* on a 2nd product needing ergonomic inline union errors (escape-hatch rule) — never the L `subForm`.

---

## Item 2 — Recursive deep-path value typing

> **SHIPPED 2026-07-10 — as option (b), the typed array-row helper (item 2b).** `useFieldArray<TItem>(form, path)`
> (`src/forms-engine/UseFieldArray.tsx`, exported from `@wow-two-beta/ui/forms-engine`): reactive `rows` + stable keys,
> element-typed ops delegating to `form.array`, and a cast-free row field — `<array.Field index={row.index} name="…">`
> binds `f.value` typed as `TItem['…']` (one `keyof TItem`, no recursion, no vendor `DeepKeys`). Engine-free: it composes
> only the contract (`form.array` · `form.Field` · `form.useFormState`), so ONE implementation serves both adapters —
> conformance 86→94 across `house` + `tanstack` (4 cases/engine). The F-2e/F-2d `ArrayRows` story refactored onto it (the
> `f.value as string` per-row cast deleted), and `conventions/…/presentation/forms.md` §Arrays now mandates it. Option (a)
> (recursive `PathValue`) stays **rejected** for the reasons below. Items 1 and 3 remain deferred.

### Problem + evidence

`AppFieldValue<TValues, TPath>` (`AppForm.ts:73`) resolves **top-level keys** to their value type and everything deeper to `unknown`:

```ts
export type AppFieldValue<TValues, TPath extends string> =
  TPath extends keyof TValues ? TValues[TPath] : unknown;
```

Consequence in the one complex form — **every cast is an array row** (`RuleControls.tsx`, 3 casts/row):

```tsx
<form.Field name={`rules[${index}].conditionType`}>{(f) => <Select value={f.value as RuleConditionType} … />}</form.Field>
<form.Field name={`rules[${index}].conditionValue`}>{(f) => <TextInput value={f.value as string} … />}</form.Field>
<form.Field name={`rules[${index}].destination`}>{(f) => <TextInput value={f.value as string} … />}</form.Field>
// in-file comment: "Deep array-row paths resolve to `unknown` … cast per row."
```

Contrast: `content`, `style`, `name` (top-level keys) bind **cast-free** in `ContentView.tsx` / `DesignView.tsx`. So the real surface area of this gap is **array rows**, not arbitrary deep dot paths.

**What TanStack exposes:** `DeepKeys<T>` + `DeepValue<T,P>` — fully recursive typed deep paths; it solved this. But surfacing them means importing vendor types into the engine-free contract (constraint 1) — **architecturally off the table** for the shared `AppFieldValue`. They already ride the `tanstack` `form.engine` escape hatch (`engine.Field` is TanStack's typed field), which is the sanctioned place for them.

### Options

| # | Option | Kills the casts | Vendor-free contract | TS cost | Effort |
|---|---|---|---|---|---|
| a | **Recursive `Path<T>`/`PathValue<T,P>`** on `name` + `AppFieldValue` (RHF/TanStack style) | Everywhere | Yes — but must **re-implement** (can't import `DeepKeys`) | **High** — deep recursive conditional types; discriminated-union path enumeration blows up, and our *one* complex value shape (`CreateCodeValues`, 10-member union) is the pathological case; cryptic hovers/errors; `PathValue` over a union yields `never`/partial on non-shared keys anyway | **L** |
| b | **Typed array-row helper** — `form.arrayField<RuleDraft>('rules')` → row fields typed one level (`keyof RuleDraft`) | **Yes — 100% of the evidence is array rows** | Yes | **Low** — one generic + one `keyof`, no recursion, no union enumeration | **M** (S folded into the array recipe) |
| c | **Stay `unknown`, document the cast (status quo)** | No | Yes | None | **S** (doc only) |

### Recommendation · effort · verdict

**Build (b) — but as the `useFieldArray(form, path)` row-render helper the F-2g strains already asked for**, not as standalone deep-path typing. It kills **every** cast in the real form (all are array rows), stays vendor-free, is TS-cheap (element generic, one level of `keyof` — no recursion), and composes with the existing `form.array(path)`. It also retires a second F-2g strain in the same stroke: *"a reorderable-array component must become form-aware … a documented `useFieldArray(form, path)` row-render helper would soften it."* Both adapters already do array reindexing (`applyArrayOperation` / `overlay.remapForArrayOperation`), so a typed row facade sits cleanly on top and is conformance-pinnable.

**Reject (a):** a large TS-perf/DX liability that our discriminated-union form *actively fights*, that re-derives what TanStack already ships, and that `PathValue`-over-a-union can't cleanly type anyway. The `unknown` deep-path rule is a deliberate, documented contract line — the escape hatch (tanstack `engine.Field`) covers the rare form that needs true typed deep paths.

**Effort:** (a) **L** · (b) **M**, or **S** folded into the F-2e array-rows recipe · (c) **S**.
**Verdict: SHIPPED (2026-07-10)** — built as (b) `useFieldArray<TItem>(form, path)`, folded onto the `ArrayRows` story; see the header note. (a) stays rejected.

---

## Item 3 — `fieldErrors` configurable recognizer

### Problem + evidence

The default `mapSubmitError` is `fieldErrors` (`foundation/http/FieldErrors.ts:11–12`), gated on `instanceof ApiError`:

```ts
export function fieldErrors(error: unknown): Record<string, string[]> {
  if (!(error instanceof ApiError)) return {};   // non-SDK throw → no per-field mapping
  …
}
```

A non-`ApiError` throw yields `{}`, so in `resolveSubmitFailure` (`SubmitErrors.ts:48–71`) `hasMatches` is false and the whole error coerces to the form-level `submitError` via `toApiError` — the failure still surfaces (banner), but **per-field routing silently no-ops**. Evidence: drydock/secrets-vault *"had to re-throw the SDK `ApiError`"*; the smart-qr F-2g note — *"it only worked because a prior iteration had already routed errors through `ApiError`."*

**Key mitigating fact:** the contract is **already per-form configurable** — `mapSubmitError?: (error) => Record<string,string[]>` (`AppForm.ts:26`) overrides the instanceof default. A product whose client throws a look-alike (fetch `Response`, axios error, custom `HttpError`) can pass its own shape-checking mapper today. The only footgun is that the *default* is a strict type guard rather than a duck-type, so a look-alike silently degrades to form-level instead of routing per-field — and **every current product throws the real `ApiError`**, so no product actually hits this.

### Options

| # | Option | Removes footgun | Blast radius | Effort |
|---|---|---|---|---|
| a | **Duck-type the default** — shape-check `error.problem?.errors` instead of `instanceof ApiError` | Yes, for look-alikes | Touches shared `foundation/http` `fieldErrors` (consumed beyond forms); trades a clean type guard for a structural sniff; small false-positive surface | **S** |
| b | **New `isFieldError`/`extractProblem` option** on `useAppForm` | Yes | **Redundant** — `mapSubmitError` already *is* this hook | **S** but wasteful |
| c | **Status quo + convention line (shipped)** — "throw the SDK `ApiError`, or pass `mapSubmitError`" | Documented, not removed | None | **0** |

### Recommendation · effort · verdict

**Keep (c).** It is already configurable via `mapSubmitError`; (b) would add a second knob for what one knob already does; (a) weakens a clean foundation type guard to fix a case no shipped product has. If `foundation/http/FieldErrors.ts` is ever opened for another reason, fold in (a) opportunistically (duck-typing a ProblemDetails-shaped body is harmless and removes the latent footgun) — but don't churn foundation for it now.

**Effort:** (a) **S/XS** · (c) **0**.
**Verdict: stay-deferred** (effectively permanent) — reclassify as a documented convention, not a backlog item.

---

## If we build — in what order

Only **one** item has a near-term, named trigger; the other two are userland patterns or documented conventions.

1. **Typed array-row helper (item 2b)** = `useFieldArray(form, path)` typed by element. **SHIPPED 2026-07-10** — folded onto the `ArrayRows` story. Retired 100% of item 2's casts **and** the F-2g "array component must become form-aware" strain in one stroke. Vendor-free, TS-cheap, conformance-pinned on both adapters (86→94).
2. **(Only on a 2nd-product hit)** union-error ergonomics (item 1) — first as a `docs/forms.md` userland pattern (explode-the-union / emit-at-`content`), and a thin `variantField` doc-helper *only* if 2+ products want inline per-leaf union errors. Never the `subForm` (L, typing-broken).
3. **(Opportunistic, ride-along)** duck-type the `fieldErrors` default (item 3a) — apply only if `foundation/http` is touched for another reason.

**Stay deferred, likely forever:** item 1's SDK abstraction (the single-field union is values-clean; per-leaf inline validation is low-value and userland-doable) and item 3's configurable recognizer (already covered by `mapSubmitError`; the default gate is a one-line convention). Only **item 2b** is worth engineering time, and only when the array recipe or a second array form pulls it in.
