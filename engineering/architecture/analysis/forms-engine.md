# `/forms-engine` — engine choice + plug-and-play adapter architecture

*Last updated: 2026-07-11*

> Design doc for the Wave-2 `/forms-engine` subpath. Owner direction: **adapter-first from day one** — one house facade over swappable engines, so apps never couple to a vendor; validation swappable too.
>
> Inputs: [`lib-adoption.md`](./lib-adoption.md) §1 forms + §2.1 (prior verdict: TanStack Form, wrap-as-peer) · [`frontend-modules-products.md`](./frontend-modules-products.md) §2 row 2 (~500 LOC of form glue across 4 products) · [`frontend-modules-ecosystem.md`](./frontend-modules-ecosystem.md) §2.1/§3.2 · SDK seams read: `foundation/primitives/formControlContext/`, `presentation/forms/{field,label,formErrorMessage,formHelperText}/`, `foundation/http/FieldErrors.ts`, `query/UseAppMutation.ts` + `UseOptimisticMutation.ts`. Lib health re-verified against npm registry + GitHub **2026-07-10**.

---

## 1. Product-derived requirements

From the real form code in the 4 API products — what shipped screens actually do, not a wishlist.

| # | Requirement | Evidence |
|---|---|---|
| R1 | **Controlled values** feeding SDK controlled inputs (`value`/`onChange`) | every product uses SDK `TextInput`/`Select`/pickers — all controlled (`useControlled` pattern) |
| R2 | **Sync field validation** — on change *and* at submit | drydock `RegisterProductForm.tsx:46–57` (repo parse per keystroke blocks submit) · smart-qr `CreateCodeScreen.tsx:166–169` (mobileApp guard at submit) |
| R3 | **Field transform on change** | drydock repo input: URL → `owner/repo` rewrite-on-paste (`onRepoChange`) |
| R4 | **Submit pipeline**: `submitting` flag · async call · success callback | all 4 — `saving`/`submitting` + `try/catch/finally` blocks |
| R5 | **Server error → form**: `ApiError` → form-level message today; per-field wanted | drydock `:73–74`, smart-qr `:199–200` catch → single string + inline `Alert`; backend contract carries per-field `ProblemDetails.errors` — `fieldErrors()` already ships in `foundation/http` |
| R6 | **Edit-mode prefill**, incl. async load-then-populate | smart-qr edit: `useEffect` → **13 setters** (`:99–132`); drydock: props-seeded defaults + immutable `slug` on edit |
| R7 | **Reset** to defaults / to loaded entity | smart-qr `reset()` `:206–209`, drydock cancel |
| R8 | **Array fields** — add / remove / reorder rows | smart-qr `rules: RuleDraft[]` + `RuleBuilder` (order, per-row fields) |
| R9 | **Nested objects + discriminated unions** in values | smart-qr `content: CodeContent` (union by `type`) + `style` object |
| R10 | **Derived state from live values** (no render tax) | smart-qr live QR preview (`previewStyle` memo over 8 fields) · transcript-forge line/URL counts |
| R11 | **Dirty / touched** state | needed for unsaved-changes guard (router `useNavigationBlocker` exists) + error-display timing; hand-rolled nowhere today because it's too tedious — the glue gap itself |
| R12 | **Per-mode field flags** (disabled/readonly per edit-create) | slug locked on edit in drydock + smart-qr |
| R13 | **Form-level error surface** | all 4 render inline `Alert` from a string state |
| — | **Non-requirements** (cut): SSR/server actions · uncontrolled-ref perf for 100+ field forms (largest real form: ~20 fields) · multi-step engine (`Wizard`/`useWizard` shipped) · debounced async field validation (no product uses one) · i18n'd messages (rides the later `LocaleProvider`) | |

Scale check: 3 of 4 products' forms are ≤8 flat fields (login, set-secret, register-product/server, batch textarea). Only smart-qr's builder is complex (R8/R9/R10). The facade must make the simple case one-screen trivial and the complex case possible.

---

## 2. Engine head-to-head (verified 2026-07-10)

| | TanStack Form | react-hook-form | house micro-engine |
|---|---|---|---|
| Version / status | `@tanstack/react-form` **1.33.1**, pub 07-09; v1 stable since [Mar 2025](https://tanstack.com/blog/announcing-tanstack-form-v1); weekly coordinated releases across 10+ framework pkgs ([releases](https://github.com/TanStack/form/releases)) | **7.81.0** stable (07-05) + **8.0.0-beta.3** (07-10) — v8 in beta since May, [RFC #7433](https://github.com/orgs/react-hook-form/discussions/7433) breaks `reset`/`useFieldArray`/error APIs | n/a — ours |
| React 19 | peer `^17 ‖ ^18 ‖ ^19` (npm); React Compiler supported ([comparison](https://tanstack.com/form/latest/docs/comparison)) | peer `^16.8–^19`; no React Compiler support yet (v8 fixing compiler re-render bugs) | trivially (built on 19) |
| Model fit vs our **controlled** components | **Controlled-first** — `field.state.value`/`handleChange` maps 1:1 onto SDK inputs | Uncontrolled `register`/ref-first; controlled components require `useController` per field — its headline perf win **evaporates against an all-controlled library** (prior verdict's core objection, confirmed) | Controlled store by construction |
| TS inference | Strictest available — template-literal deep field paths, fully inferred ([comparison](https://tanstack.com/form/latest/docs/comparison)) | Good; nested arrays need casts | Loose string paths (typed values, untyped paths) — the honest gap |
| Standard Schema | **Native** — pass zod/valibot/arktype straight to `validators` ([docs example](https://tanstack.com/form/v1/docs/framework/react/examples/standard-schema)) | Via `@hookform/resolvers` **5.4.0** `standardSchemaResolver` (works; had a broken-import episode, [#747](https://github.com/react-hook-form/resolvers/issues/747)) | Native — engine calls `schema['~standard'].validate` directly |
| Bundle (min+gz) | ~6 kB ([splitforms 2026](https://splitforms.com/blog/best-react-form-library-2026), [bundlephobia](https://bundlephobia.com/package/@tanstack/react-form)) | ~9–10.7 kB ([bundlephobia](https://bundlephobia.com/package/react-hook-form), [LogRocket](https://blog.logrocket.com/tanstack-form-vs-react-hook-form/)) | ~0 external (≈0.5–1 kB own code) |
| Ecosystem / velocity | TanStack org; devtools shipped (`react-form-devtools 0.2.30`); we already carry 5 TanStack peers in `/query` | Largest user base (~3M weekly downloads); huge resolver ecosystem; v7→v8 API churn imminent | none — no drift, ever |
| Arrays / nested / unions (R8/R9) | First-class (`mode="array"`, typed nested paths) | First-class (`useFieldArray`, v8 changes its API) | Buildable — dot-path ops, ~60 LOC |
| Honest cost | 3rd-party risk: v1 is 16 months old, minor-version churn is real (33 minors in 16 months) — pinned peer range + fix-forward absorbs it | Adapter must wrap every field in `useController` + translate resolver timing; then v8 lands and the adapter revs | **500–700 LOC + conformance tests (~2–4 sessions)**, scoped: flat+dot-path store on `useSyncExternalStore`, whole-schema validation, touched/dirty, array ops. Permanently ours to maintain — must stay scope-capped (no deep typed paths, no async-debounce validators, no linked-field graphs) |

**Verdict — v1 ships two adapters:**

- **Default: `tanstack`** (`@tanstack/react-form`, optional peer). Confirms the prior verdict with 2026 evidence: controlled-first fits the component library, Standard Schema native, strictest TS on the one complex form we have (smart-qr builder), stack consistency (TanStack peer #6), React Compiler-ready.
- **Second: `house`** — the zero-dependency micro-engine. Chosen over an RHF adapter for v1 because (a) it is the *true* vendor hedge — the stated goal is "never couple to a vendor," and a second vendor only half-delivers that; (b) zero-peer forms for the smallest portfolio apps (arcade-sized: a login + a settings form should not add any peer); (c) it keeps the contract honest — a contract implemented twice against radically different internals cannot silently alias TanStack's API; (d) RHF is mid-v8-beta — an adapter written today revs on landing, and its `useController`-everywhere shape buys us nothing controlled inputs don't already have.
- **`rhf` adapter: phase 2, on trigger** (a consumer asks, or v8 ships stable). The contract below is design-checked against RHF v7/v8 now (every member maps: `useController`, `handleSubmit`, `useFieldArray`, `setError`, `formState` subscriptions) so the door stays provably open — that check is the adapter-first discipline even while the adapter itself waits.

---

## 3. Validation layer

**Interface: Standard Schema v1 — spec-typed, never lib-typed.** `@standard-schema/spec` **1.1.0** is a types-only package ([standardschema.dev](https://standardschema.dev/), [repo](https://github.com/standard-schema/standard-schema)); vendor the ~30-line `StandardSchemaV1` type into `foundation` (spec is MIT and designed for copying) → zero runtime dep, zero peer. All three candidate libs implement it natively: zod ≥3.24/4, valibot ≥1.0, arktype ≥2.0. Both v1 engines consume it natively (tanstack built-in; house calls `~standard.validate`, which may return a Promise — the contract's `isValidating` covers async schemas for free). Consequence: **swapping validation lib is a per-form choice, invisible to the SDK.**

**Default lib for wow-two apps: `zod` 4 (4.4.3)** — documented default, not a dependency:

- **.NET ergonomics** — fluent chain `z.string().min(3).regex(…)` is FluentValidation muscle memory; valibot's `v.pipe(v.string(), v.minLength(3))` reads functional-first.
- **DX / agent-codegen ubiquity** — zod is the schema lingua franca (tRPC, AI SDKs, OpenAPI codegen); in an agent-driven workflow model-generated zod is consistently idiomatic. Bundle answer inside the same lib: `zod/mini` at ~3.9 kB gz when a surface is size-critical ([pkgpulse](https://www.pkgpulse.com/guides/zod-v4-vs-arktype-vs-typebox-vs-valibot-2026)).
- Size context: zod 4 core ~12–14 kB gz (57% smaller than v3) vs **valibot 1.4.2 at ~1.4 kB** tree-shaken ([pockit teardown](https://pockit.tools/blog/zod-valibot-arktype-comparison-2026/)) — valibot stays the *documented size-first alternative* (drop-in via the same spec seam). arktype 2.2.3 rejected as default: ~40 kB full lib for speed no form needs.

---

## 4. Facade contract (the core deliverable)

The whole house surface apps code against — identical across engines. Contract types live in `/forms-engine` (engine-free); each adapter exports the same `useAppForm`.

```ts
import type { StandardSchemaV1 } from '../foundation/schema';       // vendored spec types — zero runtime dep
import type { ApiError } from '../foundation/http';

/** Defines the options every engine adapter accepts. */
export interface AppFormOptions<TValues extends object> {
  /** The initial values. Async prefill (edit screens) stays on `/query` — render the form once loaded, or `reset(data)`. */
  readonly defaultValues: TValues;
  /** The whole-form validator — any Standard Schema (zod / valibot / arktype). Sync or async. */
  readonly schema?: StandardSchemaV1<TValues>;
  /** When client validation runs. `'submit'` (default) re-validates touched fields on change after the first attempt. */
  readonly validateOn?: 'change' | 'blur' | 'submit';
  /** Performs the submit with valid values — usually a `useAppMutation` / `useOptimisticMutation` `mutateAsync`. */
  readonly onSubmit: (values: TValues) => Promise<unknown>;
  /** Maps a thrown submit error to `path → messages`. Default: `fieldErrors` (ProblemDetails, both .NET shapes). */
  readonly mapSubmitError?: (error: unknown) => Record<string, string[]>;
  /** Rewrites a server error path onto a form path. Default: camelCase per segment (`Rules[0].Destination` → `rules[0].destination`). */
  readonly mapFieldPath?: (serverPath: string) => string;
}

/** The per-field render API a `<form.Field>` child receives. */
export interface AppFieldApi<TValue> {
  readonly value: TValue;
  readonly setValue: (value: TValue) => void;
  /** Marks the field touched — the Field glue also wires it onto the control's blur. */
  readonly onBlur: () => void;
  /** Client + server messages merged (client first); server messages clear on the next change to the field. */
  readonly errors: readonly string[];
  readonly isDirty: boolean;
  readonly isTouched: boolean;
}

/** The reactive slice `Subscribe` / `useFormState` select from — selector-subscribed, never a form-wide re-render. */
export interface AppFormState<TValues> {
  readonly values: TValues;
  readonly isDirty: boolean;
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
  readonly isValidating: boolean;
  /** The submit failure whose mapped paths matched no field — feed the form-level `Alert`. */
  readonly submitError: ApiError | null;
}

/** What `useAppForm` returns — identical across engines; `TEngine` types the escape hatch. */
export interface AppForm<TValues extends object, TEngine = unknown> {
  /** Field wrapper — optional `label`/`helper` render via presentation `Field`; always provides `FormControlContext`
   *  (id / labelId / errorId / isInvalid / isDisabled / isRequired) so the control + `FormErrorMessage` auto-wire aria. */
  readonly Field: AppFieldComponent<TValues>;
  /** Render-prop subscription to a state slice (also exposed as the `useFormState(selector)` hook). */
  readonly Subscribe: AppSubscribeComponent<TValues>;
  /** Validates, runs `onSubmit`, applies mapped server errors to fields, leaves the remainder in `submitError`. */
  readonly handleSubmit: (event?: FormEvent) => Promise<void>;
  /** Array helpers at a path — `push` / `insert` / `remove` / `swap` / `move` (R8). */
  readonly array: (path: string) => AppArrayApi;
  /** Resets to `defaultValues`, or re-seeds with `next` (edit-mode prefill — kills smart-qr's 13-setter effect). */
  readonly reset: (next?: TValues) => void;
  /** Applies server field errors outside the submit pipeline (e.g. a deferred backend check). */
  readonly setFieldErrors: (errors: Record<string, string[]>) => void;
  /** ESCAPE HATCH — the native engine form instance. See the 90/10 rule below. */
  readonly engine: TEngine;
}

/** The module contract every adapter satisfies — enforced by the conformance suite, swapped by import path. */
export interface FormEngine {
  useAppForm<TValues extends object>(options: AppFormOptions<TValues>): AppForm<TValues>;
}
```

**The 90/10 escape-hatch rule.** The facade deliberately covers only the product-derived 90% (§1). Anything past it — per-field async validators with debounce, listener graphs, TanStack's typed deep-path `form.Field` — is reached through `form.engine`, which the adapter types natively (`AppForm<T, ReactFormApi<T>>` from `/forms-engine/tanstack`). Using it couples **that form** (only) to the chosen adapter, visibly at the import site — never the app, never the SDK. Escalation rule: the moment 2+ forms in the portfolio reach for the same escape, that feature is contract-promotion backlog, not copy-paste.

**Submit-side integration is a Promise seam, not a dependency.** `onSubmit: (values) => mutation.mutateAsync(values)` plugs `useAppMutation`/`useOptimisticMutation` in without `/forms-engine` peering on `@tanstack/react-query` — the two subpaths stay independently adoptable, and invalidation/optimistic concerns stay in `/query` where they live. The form side owns: `isSubmitting`, `fieldErrors(error)` application (R5 — the .NET validation contract closed end-to-end), unmapped remainder → `submitError`.

---

## 5. Adapter architecture

**The seam is the import path, not a runtime registry.** React hooks can't hide behind a runtime-swappable object without breaking rules-of-hooks + tree-shaking; import-level polymorphism is the React-idiomatic adapter seam:

```
@wow-two-beta/ui/forms-engine            ← contract types + Field/Subscribe glue + fieldErrors wiring (engine-free)
@wow-two-beta/ui/forms-engine/tanstack   ← useAppForm over @tanstack/react-form   (optional peer)   ← DEFAULT
@wow-two-beta/ui/forms-engine/house      ← useAppForm over the house micro-store  (zero deps)
@wow-two-beta/ui/forms-engine/rhf        ← phase 2, on trigger (react-hook-form optional peer)
```

- **Per-app swap point = one line.** Convention (documented, stamped by `create-repo`): apps re-export from `src/form.ts` — `export { useAppForm } from '@wow-two-beta/ui/forms-engine/tanstack';` — screens import `useAppForm` from `@/form`. Changing engines is editing that one line; no screen touches a vendor name.
- **Peer wiring** — the exact `/query` pattern: `@tanstack/react-form` added to `peerDependencies` + `peerDependenciesMeta.optional: true`; `/forms-engine/house` and the contract entry stay dep-free. `tsup` entry per subpath; `package.json` `exports` gains the three keys.
- **ESLint boundaries** gate the peer to its adapter folder (same rule shape that fences `/router`/`/query`): only `src/formsEngine/tanstack/**` may import `@tanstack/react-form` — the leak-proofing the root CLAUDE.md already prescribes for new peers.
- **Conformance suite** — the anti-LCD instrument: one spec file (`formEngineContract.shared.ts`) runs the full behavioral matrix (R1–R13: validateOn timing, error merge/precedence, server-error clearing, array ops, reset semantics, dirty tracking) against **every** adapter. An adapter is done when the suite is green; a contract change without a green matrix doesn't ship. This pins semantics, not just signatures — the difference between "two engines" and "two behaviors."
- **Presentation glue reuse, not duplication:** `form.Field` composes the shipped `Field` (which already renders `FormControlProvider` + `Label` + `FormErrorMessage`/`FormHelperText`) passing `error={errors[0]}` — so aria wiring (`id`/`labelId`/`errorId`/`aria-describedby`/`role=alert`) comes from the existing L4 component untouched, and every SDK input that reads `useFormControl()` works unmodified.

---

## 6. App usage sketch (drydock `RegisterProductForm` rewritten)

```tsx
// src/form.ts — the app's engine pin (the only vendor-touching line in the app)
export { useAppForm } from '@wow-two-beta/ui/forms-engine/tanstack';

const save = useAppMutation({ mutationFn: registerProduct, invalidates: () => [productKeys.list] });
const form = useAppForm({
  defaultValues: { slug: '', name: '', repo: '' },
  schema: RegisterProductSchema,                      // zod 4 today — any Standard Schema tomorrow
  onSubmit: (values) => save.mutateAsync(values),     // ProblemDetails.errors auto-land on fields
});

<form onSubmit={form.handleSubmit}>
  <form.Field name="slug" label="Slug">{(f) => <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} disabled={isEdit} />}</form.Field>
  <form.Field name="repo" label="Repo (owner/repo or URL)">{(f) => <TextInput value={f.value} onChange={(e) => f.setValue(parseRepoInput(e.target.value))} />}</form.Field>
  <form.Subscribe selector={(s) => s.isSubmitting}>{(busy) => <Button type="submit" isLoading={busy}>Register</Button>}</form.Subscribe>
  <form.Subscribe selector={(s) => s.submitError}>{(err) => err && <Alert tone="danger">{err.message}</Alert>}</form.Subscribe>
</form>
```

8 `useState`s + hand validation + catch-block → schema + two bindings. Multiply by the ~500 LOC of glue across 4 products.

---

## 7. Risks & mitigations (adapter tax, honestly)

| Risk | Reality check | Mitigation |
|---|---|---|
| **LCD contract** — facade sinks to the engines' intersection | Real. That intersection, by construction, ⊇ R1–R13 — everything shipped products do | Thin-contract rule: contract grows only from product evidence; everything else is the escape hatch; "2+ forms escape for the same thing → promote" |
| **Double maintenance** — every adapter is a test-matrix row | Real: 2 adapters v1, 3 later | Shared conformance suite makes the cost one spec run per adapter, not N hand-written suites; house adapter has zero upstream drift by definition |
| **Semantic drift** — same API, different timing (validation runs, error clearing, reset) | The subtle killer of adapter layers | Conformance suite pins *behavior* (validateOn matrix, merge precedence, touched semantics) — signatures alone are not conformance |
| **Escape-hatch abuse** → de-facto vendor coupling | Human nature | `engine: unknown` on the shared contract (typed only via the adapter import — coupling is visible at the import site); promotion rule above; grep-auditable (`\.engine\b`) |
| **TanStack Form churn** — 33 minors in 16 months; v1 is young | Moderate | Optional-peer range pinned per adapter; beta-forever fix-forward absorbs minors; worst case = the whole point of this architecture: flip the app's `src/form.ts` line to `/house` |
| **RHF v8 timing** | Why the rhf adapter waits | Contract design-checked against v7 **and** the v8 RFC now; adapter built once v8 stabilizes or a consumer pulls it |
| **House engine scope creep** — becomes a bad third form library | The classic failure | Documented ceiling in its module doc: flat + dot-path store, whole-schema validation, arrays, dirty/touched — **no** typed deep paths, no per-field async/debounce, no linked-field graphs; complex form → tanstack adapter |
| **Standard Schema bet** | Tiny — spec v1 frozen, types-only, authored jointly by the zod/valibot/arktype maintainers | Types vendored; worst case the facade accepts a `validate` delegate — one signature away |

---

## 8. Phased build plan

**v1 (Wave 2 — after `foundation/config`, per the ecosystem build order):**
1. Contract types + `Field`/`Subscribe` glue over presentation `Field` + `fieldErrors`/`mapFieldPath` pipeline (engine-free entry).
2. `tanstack` adapter (default) — optional peer + ESLint boundary + exports wiring.
3. `house` micro-adapter — `useSyncExternalStore` store, dot-path get/set, Standard Schema validate, arrays, dirty/touched (scope ceiling documented in-module).
4. Conformance suite green over both + interaction stories (login, register-product, array-rows) + docs page with the `src/form.ts` convention.
5. Proof migration: drydock `RegisterProductForm` + secrets-vault `LoginForm` (simple tier) on `tanstack`.

**v1.1:** smart-qr `CreateCodeScreen` migration — the stress case (R6 async prefill via `reset`, R8 rules array, R9 content union, R10 preview off `Subscribe`); focus-first-invalid polish; unsaved-changes recipe (`isDirty` × router `useNavigationBlocker`); `create-repo` template stamps `src/form.ts`.

**v2 (on trigger):** `rhf` adapter (consumer demand or v8 stable) — the conformance suite is the acceptance bar; devtools bridge (`react-form-devtools` behind the tanstack adapter, dev-only like QueryDevtools); `Wizard` per-step schema recipe; `useUndoableMutation` pairing once it lands in `/query`.

**Explicitly not planned:** own validation lib (Standard Schema seam is the whole point) · SSR/action bindings (CSR lock) · form builders/JSON-schema renderers (app territory).
