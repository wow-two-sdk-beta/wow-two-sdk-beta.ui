# Forms vector — completeness map

*Last updated: 2026-07-11*

> The whole forms/fields/validation vector — "everything known to the universe about forms" — each capability with a verdict, per the SDK doctrine
> [`conventions/development/dev-cycle.md` §Vector completeness](../../../../../conventions/development/dev-cycle.md): build the vector proactively to completeness, not the triggering
> product's ask. This is the completeness map that doctrine mandates (`docs/analysis/{vector}-*.md`, all capabilities enumerated, each verdicted
> ship-now / defer-with-named-trigger / skip-with-reason — plus **shipped** for what already exists).
>
> **Method:** the shipped surface is read from source (`src/forms-engine/**` — `AppForm.ts` contract, `house` + `tanstack` adapters, `UseFieldArray`,
> `FocusFirstInvalid`, `SubmitErrors`, `SchemaValidation`, `FormGlue`, 47-case `conformance/`), not recalled. The universe of capabilities is the
> verified union of the mature 2026 form libraries — TanStack Form, react-hook-form (v7/v8-beta), Formik, React Final Form, Mantine `useForm`, Ant Design
> Form, and the JSON-schema generators (RJSF / JSON Forms / uniforms). Each foreign capability is scored against **our** engine, not adopted wholesale.
>
> **Prior analyses (extend, don't re-derive):** [`forms-engine.md`](./forms-engine.md) (the shipped design — R1–R13, adapters, conformance) ·
> [`forms-vector-next.md`](./forms-vector-next.md) (the F-2 maturation plan + §5 DONE checklist this doc extends) ·
> [`forms-deferred-items.md`](./forms-deferred-items.md) (the 3 architectural deep-dives: union errors · deep-path typing · error recognizer) ·
> app-facing rules [`conventions/…/presentation/forms.md`](../../../../../conventions/development/frontend/presentation/forms.md) ·
> engine architecture [`conventions/…/swappable-modules.md`](../../../../../conventions/development/swappable-modules.md).

---

## 1. The verdict table

Every capability across every axis, verdicted. `shipped` = already in the contract / glue / helpers (source-cited). `ship-now` = essential, the vector
demands it, no product yet requires it — build in this pass. `defer` = a named external dependency or a genuinely product-shaped design decision gates it
(the escape hatch covers it meanwhile). `skip` = deliberately out of scope (userland pattern, escape-hatch territory, or another module's job).

| # | Capability | Axis | Verdict | Rationale (source / reason) | Trigger if deferred |
|---|---|---|---|---|---|
| 1 | Submit pipeline (validate → `onSubmit` → map server errors → remainder to `submitError`) | Form | **shipped** | `handleSubmit` + `resolveSubmitFailure` (`SubmitErrors.ts`); both adapters | — |
| 2 | Submit verdict — `handleSubmit(): Promise<boolean>` + reactive `isSubmitSuccessful` | Form | **shipped** | `AppForm.ts:155`, `AppFormState.isSubmitSuccessful`; F-2h | — |
| 3 | **Auto-submit** — `submitOn: 'change' \| 'blur' \| 'manual'` (+ `submitDebounceMs`) | Form | **shipped** | `AppFormOptions.submitOn` / `submitDebounceMs`; both adapters schedule a trailing-debounced (or `'blur'`-triggered) run through the ONE `submit()` path; `reset()` / prefill non-triggering; timer released on unmount (2026-07-11) | — |
| 4 | **`submitInvalid`** — validate-but-submit-anyway (backend as source of truth) | Form | **shipped** | `AppFormOptions.submitInvalid`; both adapters always validate (client errors stay advisory) then gate `onSubmit` on `submitInvalid \|\| isValid`; the verdict follows `onSubmit`, not the client gate (2026-07-11) | — |
| 5 | Concurrent-submit guard (ignore/coalesce re-entrant submit while `isSubmitting`) | Form | **shipped** | Single-flight latch in both adapters' `submit()` — a re-entrant trigger (double-click / Enter-spam / `submitOn:'change'` burst) coalesces onto the in-flight run, never a double-`onSubmit`; conformance-pinned (2026-07-11) | — |
| 6 | Reset semantics — `reset()` → `defaultValues`; `reset(next)` re-seeds values **and** dirty baseline | Form | **shipped** | `HouseFormCore.reset` / tanstack `reset`; documented `reset()`-after-`reset(data)` footgun in `forms.md` | — |
| 7 | Multi-step / wizard (per-step schema gate) | Form | **shipped** | `presentation/forms/wizard` + `useWizard` + `FormsRecipes` `WizardPerStepValidation` story; per-step mini-form pattern | — |
| 8 | Nested / sub-forms (`form.subForm(path)` scoping a child `AppForm`) | Form | **skip** | `forms-deferred-items.md` item 1b — **L** to build in both adapters and still can't type a union sub-path; single-object-field modeling + spread-merge covers the real need | 2+ products need an independently-validated/submitted nested section |
| 9 | Submit retry (auto-retry a failed submit) | Form | **skip** | Retry is a mutation-layer concern — `/query` `useAppMutation` owns it; the form's `onSubmit` is one Promise | — |
| 10 | Whole-form `isDisabled` (disable every field at once — RHF `disabled`, Ant `disabled`) | Form | **shipped** | `AppFormOptions.isDisabled` ORs into every `form.Field`'s `FormControlProvider` disabled (glue-level, both engines) + makes `handleSubmit` / auto-submit inert; conformance-pinned (2026-07-11) | — |
| 11 | Optimistic submit | Form | **shipped** | `onSubmit` → `/query` `useOptimisticMutation`; `FormsRecipes` `OptimisticSubmit` story | — |
| 12 | `transformValues` before submit (Mantine) | Form | **shipped** | Convention: `onSubmit` maps the `*Values` editable shape → model/`*Dto`, re-trims schema transforms (`forms.md` §Submit) — no engine hook needed | — |
| 13 | Async default values / `isLoading` (RHF) | Form | **shipped** (by design) | Async prefill stays on `/query`: render once loaded, or `reset(data)` — `forms-engine.md` R6 + non-requirement; not an in-form concern | — |
| 14 | Schema-driven field generation (auto-render a whole form from a schema — RJSF / JSON Forms / uniforms) | Form | **skip** | Explicitly not-planned (`forms-engine.md` §8). The schema **validates**, it does not **render**; RJSF's schema-as-behavior + re-render model fights a controlled component library — our explicit `form.Field` wiring is the deliberate opposite bet. A genuine forms-as-data need is a **separate `schema-form` module**, never a contract change | A forms-as-data admin surface (config-driven form catalog) ships as a product need |
| 15 | Form devtools (TanStack `react-form-devtools` bridge, dev-only) | Form | **defer** | Dev-only, behind the tanstack adapter like `QueryDevtools`; low leverage — house engine has no devtools to bridge | A recurring form-debugging pain point, or a consumer asks |
| 16 | `submitCount` exposure on form state | Form | **skip** | Tracked internally (`InternalState.submitCount`) but off `AppFormState`; "you've tried N times" is niche — a one-line expose on first real demand | A product needs attempt-count UI |
| 17 | Value / dirty / touched (per field) | Field | **shipped** | `AppFieldApi` (`value`/`isDirty`/`isTouched`); baseline-compared dirty, blur-or-submit touched | — |
| 18 | Field-level **independent** validators (per-field trigger, distinct from the whole schema) | Field | **skip** | Whole-schema-with-per-path-routing is the design (house ceiling); TanStack per-field validators ride `form.engine`. Per-path error **display** already works | 2+ forms reach `form.engine` for the same per-field validator → promote |
| 19 | Async field validation + debounce (e.g. debounced username-availability on change) | Field | **defer** | House ceiling = whole-schema async only (no debounce); tanstack escape hatch has `onChangeAsync`+`asyncDebounceMs`. The **right SDK shape** (a per-field async surface vs whole-schema) is unknown until a 2nd product shows it | 2nd product needs a debounced server-uniqueness check |
| 20 | Dependent / derived fields (name → slug; recompute B from A) | Field | **shipped** | `form.setValue(path, value)` cross-field write (F-2h) + `Subscribe`-derived reads; `forms.md` §Validation-timing | — |
| 21 | Conditional visibility (show B when A === x) | Field | **skip** | Pure render: `form.Subscribe selector={s => s.values.type}` → conditionally render the `Field`. No engine primitive (Ant needs `shouldUpdate`/`dependencies` only because its fields self-register; ours don't) — document as a pattern | — |
| 22 | Warnings vs errors (non-blocking soft messages — Final Form, Ant `warningOnly`) | Field | **defer** | Errors-only today. A true per-field **warning channel** (advisory, non-blocking, distinct from errors) needs a new state slice in both adapters; `submitInvalid` (#4) is the crude form-level cousin. Escape/second-schema pattern documents it meanwhile | A product needs advisory validation (e.g. password-strength soft-warn that doesn't block) |
| 23 | Masking / formatting (`MaskedInput`) | Field | **shipped** | `presentation/forms/maskedInput` (form-wired via `useFormControl`); value transform is control-level, emitted through `f.setValue` — R3 transform-on-change (drydock repo-URL rewrite) | — |
| 24 | Character count (`CharacterCount`) | Field | **shipped** | `presentation/forms/characterCount` (`aria-live="polite"`) — a display widget over the value the app already holds; not an engine concern | — |
| 25 | Field-level readonly / disabled / required | Field | **shipped** | `AppFieldProps.isDisabled/isRequired/isReadOnly` → `FormControlProvider` → every wired control | — |
| 26 | Field arrays — add / remove / reorder + row-scoped errors + **typed** rows | Field | **shipped** | `form.array` primitive + `useFieldArray<TItem>` typed row helper (`UseFieldArray.tsx`); conformance 86→94 | — |
| 27 | Field-level permissions (RBAC hide/disable by role) | Field | **skip** | Composition of conditional visibility (#21) + per-field flags (#25) + app auth — the SDK's part (the flags) ships; the policy is the app's | — |
| 28 | Field-unmount value retention (RHF `shouldUnregister` / Ant `preserve`) | Field | **shipped** (by design) | Values live in the store keyed by path — unmounting a `Field` never drops its value (= `preserve: true`). Dropping on hide is userland (`setValue(path, undefined)`) | — |
| 29 | Aggregate `dirtyFields` / `touchedFields` map (which fields changed) | Field | **skip** | Per-field `isDirty`/`isTouched` + form-level `isDirty` ship; the form-wide **map** is niche — expose on demand | A product needs a per-field-changed diff view |
| 30 | Whole-schema validation + Standard Schema (zod / valibot / arktype) | Validation | **shipped** | `runStandardSchema` over the vendored `StandardSchemaV1`; zero runtime dep | — |
| 31 | Sync / async schema | Validation | **shipped** | `runStandardSchema` returns value-or-Promise; `isValidating` covers async; epoch-guarded in house | — |
| 32 | Cross-field validation (`refine` / `superRefine`) | Validation | **shipped** | Whole-schema; smart-qr `rules` `superRefine` → row-scoped errors proven | — |
| 33 | `validateOn` modes — `'change' \| 'blur' \| 'submit'` | Validation | **shipped** | `AppFormOptions.validateOn`; tanstack maps 1:1 onto `revalidateLogic` mode | — |
| 34 | **Validate-on-mount** (Formik `validateOnMount`, TanStack `onMount`) | Validation | **shipped** | `AppFormOptions.validateOnMount`; one validation on mount (house store-init, tanstack `engine.validate('submit')` in an effect) seeds `isValid` / field errors, fields left untouched (`isTouched` false); conformance-pinned (2026-07-11) | — |
| 35 | **Imperative validate-only** — `form.validate(): Promise<boolean>` (RHF `trigger`, TanStack `validateAllFields`, Ant `validateFields`) | Validation | **shipped** | `AppForm.validate()` on both adapters — marks touched, runs the whole-form schema, resolves client validity; `onSubmit` never runs, server overlay untouched; conformance-pinned (2026-07-11) | — |
| 36 | Revalidation strategy (post-first-attempt re-validate cadence — RHF `reValidateMode`) | Validation | **shipped** (fixed policy) | After the first attempt, touched fields re-validate on change (house `shouldValidateOnChange`; tanstack `modeAfterSubmission:'change'`). Making the cadence configurable = **skip** (no product needs a different post-submit rhythm) | — |
| 37 | Per-field schema | Validation | **skip** | Same design line as #18 — one whole-form schema; per-field schema is escape-hatch territory | — |
| 38 | Multi-error per field (RHF `criteriaMode: 'all'`) | Validation | **shipped** | `errors: string[]` collects every issue per path (client+server merged); `FormErrorMessage` renders all (F-2a) | — |
| 39 | i18n / localized messages | Validation | **defer** | Engine path is already i18n-clean (messages schema-owned; `fallbackErrorMessage` overridable — F-2h). The 43 embedded field-component English strings ride the **P6 LocaleProvider** sweep; forms add zero new hard-coded strings | P6 `LocaleProvider` lands |
| 40 | Hints / help text | Validation | **shipped** | `FormHelperText` chrome, `aria-describedby`-wired via `FormControlContext` | — |
| 41 | `delayError` (debounced error **display** — RHF) | Validation | **skip** | Niche; `validateOn:'blur'`/`'submit'` already defers surfacing; escape hatch if ever needed | — |
| 42 | Imperative set/clear errors | Validation | **shipped** | `setFieldErrors(map)` (replace server overlay) + `clearSubmitError()` (F-2h) | — |
| 43 | `fieldErrors` + `submitError` + `clearSubmitError` | Server | **shipped** | Default `mapSubmitError` = `fieldErrors` (both .NET ProblemDetails shapes); `AppFormState.submitError`; `clearSubmitError` | — |
| 44 | Partial mapping (matched paths → fields, remainder → `submitError`) | Server | **shipped** | `resolveSubmitFailure` partitions by `isKnownField` — no server message silently disappears | — |
| 45 | Server-error retry | Server | **skip** | `/query` mutation concern, not the form | — |
| 46 | Configurable error recognizer (`fieldErrors` `instanceof ApiError` gate) | Server | **skip** | `forms-deferred-items.md` item 3 — `mapSubmitError` **is** the per-form hook; the default gate is a documented convention ("throw the SDK `ApiError`") | Fold duck-typing in only if `foundation/http` is opened for another reason |
| 47 | Focus-first-invalid on failed submit (RHF `shouldFocusError`) | UX/a11y | **shipped** | `focusFirstInvalid(root)` helper (`FocusFirstInvalid.ts`) — reads the glue-stamped `aria-invalid`, engine-neutral; `FocusFirstInvalid` recipe | — |
| 48 | Error live-region announcement (`aria-live`) | UX/a11y | **shipped** | `FormErrorMessage` `role="alert"` (implicit assertive live region) — verified `FormErrorMessage.tsx:35`; form-level `Alert` announces the remainder | — |
| 49 | Scroll-to-error (Ant `scrollToFirstError`) | UX/a11y | **shipped** | Piggybacks `focusFirstInvalid` — `.focus()` scrolls the control into view (the a11y-correct move: focus **and** scroll, not scroll alone) | — |
| 50 | Dirty-navigation guard | UX/a11y | **shipped** | `isDirty` (baseline-compared) × `router/UseNavigationBlocker`; `DirtyNavigationGuard` recipe | — |
| 51 | Draft autosave / restore / cross-tab | Persistence | **defer** | Blocked on **W2-c storage v2** (`forms-vector-next.md` F-2e) — the persistence layer the recipe writes against does not exist yet | W2-c storage v2 ships |

**Tally:** 51 capabilities inventoried — **34 shipped · 0 ship-now · 5 defer · 12 skip**. The 6 ship-now items (§2) all **shipped 2026-07-11** — both
adapters, routed through the one `submit()` path, conformance 94→114 (57 shared cases × 2 engines); the 5 defers are dependency- or shape-gated
(documented, non-blocking); the 12 skips are userland patterns, escape-hatch territory, or another module's job.

---

## 2. Ship-now shortlist (ordered by leverage)

> **All 6 shipped 2026-07-11** — both adapters, additive, routed through the one `submit()` path, each pinned by a new shared conformance case
> (`conformance/FormEngineContract.shared.tsx`, 47→57 shared cases = 94→114 across both engines). The build below is the record of what landed.

The remaining forms build work. Each ships to **both** adapters and is pinned in `conformance/FormEngineContract.shared.tsx` (behavior, not just
signature — the anti-LCD rule). #1–#3 are one coherent build (auto-submit is only correct **with** the concurrent guard); #4–#5 complete the validation
entry surface; #6 is the trailing polish.

1. **`submitOn` auto-submit (+ `submitDebounceMs`)** — *highest leverage; owner-requested.* Unlocks the settings / save-on-blur / live-save form class the
   contract cannot express today without the escape hatch. **Build:** the adapter subscribes to value changes (it already runs `useSyncExternalStore` over
   the store) → debounce (trailing) → call the same internal `submit()`; `blur` variant fires on `blurField`; `reset()`/prefill are non-triggering (only
   user-origin changes fire). Conformance: `change`→(debounce)→`onSubmit` with latest values · `blur`→`onSubmit` · `manual`→no auto-fire.
2. **`submitInvalid`** — *owner-requested.* Backend-as-source-of-truth gate. **Build:** one branch in `submit()` — always validate (so `field.errors`
   populate and render), then gate `onSubmit` on `submitInvalid || isValid`; the verdict then reflects `onSubmit`'s outcome, not the client gate.
   Conformance: `submitInvalid:true` + invalid → `onSubmit` **runs** with the (invalid) values, client errors still present · `false` + invalid →
   `onSubmit` **not** called.
3. **Concurrent-submit guard** — *correctness; prerequisite for #1.* **Build:** `submit()` early-returns (or coalesces to a single trailing run) while
   `isSubmitting`; uniform across both adapters so it is conformance-pinned rather than left to TanStack's internals. Conformance: two overlapping
   `handleSubmit` calls → exactly one `onSubmit` in flight.
4. **`form.validate(): Promise<boolean>`** — *validate-without-submit.* The missing validation entry; cleanly gates single-form multi-step and "is it valid
   now" checks. **Build:** extract the validation half of `submit()` into a public method on both adapters. Conformance: `validate()` populates
   `field.errors` + returns the verdict, `onSubmit` **not** called.
5. **`validateOnMount?: boolean`** — *initial validity.* Edit-screen validity indicators + wizard step-entry gating. **Build:** run one validation on mount
   when set (house: in the store init; tanstack: `onMount` validator). Conformance: errors/`isValid` reflect the initial values before any interaction.
6. **Whole-form `isDisabled?: boolean`** — *lowest leverage.* **Build:** OR the form-level flag into every `form.Field`'s `FormControlProvider` `disabled`.
   Conformance: every wired control reports disabled; `onSubmit` blocked while disabled.

---

## 3. Config sketch — `submitOn` / `submitInvalid` (peers of `validateOn`)

Both slot into `AppFormOptions` (`AppForm.ts:16`) as flat option fields — no new surface shape (see §4). Shown with the existing `validateOn` for context;
the validation-config cluster is `validateOn` · `validateOnMount` · `submitInvalid`, and the submit-config cluster is `submitOn` · `submitDebounceMs`.

```ts
export interface AppFormOptions<TValues extends object> {
  readonly defaultValues: TValues;
  readonly schema?: StandardSchemaV1<TValues>;
  readonly onSubmit: (values: TValues) => Promise<unknown>;

  // ── validation-config cluster ───────────────────────────────────────────────
  /** When client validation runs. `'submit'` (default) re-validates touched fields on change after the first attempt. */
  readonly validateOn?: 'change' | 'blur' | 'submit';
  /** Validate once on mount — seeds `isValid` / field errors before any interaction (edit-screen validity, wizard step-entry gate). Default `false`. */
  readonly validateOnMount?: boolean;
  /**
   * How a failed client validation gates the submit. `false` (default) blocks `onSubmit` on errors
   * (client is the gate); `true` validates (errors still populate + render, advisory) but runs
   * `onSubmit` regardless — the **backend is the source of truth**. Belongs here, on the
   * validation-config surface, because it is a validation→submit *gate policy*, not a submit callback.
   */
  readonly submitInvalid?: boolean;

  // ── submit-config cluster ───────────────────────────────────────────────────
  /**
   * What triggers a submit. `'manual'` (default) = only `handleSubmit` / the `<form onSubmit>` path
   * (today's behavior). `'change'` = any field change schedules a submit (settings / live-save);
   * `'blur'` = submit when a field blurs (save-on-blur). Named `'manual'` — not `'submit'` — so it
   * never reads as a `validateOn` value.
   */
  readonly submitOn?: 'change' | 'blur' | 'manual';
  /** Debounce (ms, trailing) for `submitOn: 'change'`. Default `0`. Ignored for `'blur'` / `'manual'`. */
  readonly submitDebounceMs?: number;

  // …mapSubmitError, mapFieldPath, fallbackErrorMessage unchanged…
}
```

**Semantics (both pinned by conformance):**

- `submitOn` routes through the **same** `submit()` as `handleSubmit`, so validation, the `submitInvalid` gate, server-error mapping, the verdict, and the
  concurrent guard all apply identically — auto-submit is not a second code path.
- **`submitOn` × `submitInvalid`:** with the default `submitInvalid:false`, a `submitOn:'change'` burst that fails validation only updates errors and does
  **not** call `onSubmit` (no server spam on invalid) — the debounce + concurrent guard coalesce the valid trailing edge. With `submitInvalid:true`, every
  debounced change submits and the server validates.
- **`submitOn` × reset/prefill:** `reset()` / `reset(data)` must be flagged non-triggering — only user-origin changes fire an auto-submit (else prefill
  self-submits).
- **`submitInvalid` verdict:** `handleSubmit()` / `isSubmitSuccessful` reflect `onSubmit`'s resolution (not the bypassed client gate) when `true`; client
  `field.errors` remain visible as advisory. This is the coarse form-level cousin of the deferred per-field **warnings** channel (#22).

---

## 4. Decision record — options object, not a fluent builder

**Settled convention:** `AppFormOptions` is a flat options object. New capabilities are added as **option fields** (as `submitOn` / `submitInvalid` /
`validateOnMount` above), never as builder methods. There is no `.NET-style` fluent form builder, and there will not be one. Reasoning:

1. **A React hook re-runs every render.** A fluent builder (`form().field('x').required().validate(…)`) rebuilds its closures and intermediate objects on
   every render, churning referential identity and defeating the memo / effect-dep stability the rest of the engine relies on. A single option literal is
   one stable object; the adapters already lean on latest-ref (`optionsRef.current`) over it.
2. **Inference is worse in a chain.** An options object hands TS the whole shape at once — `TValues` is inferred from `defaultValues`, the schema is checked
   against it in the same position. A builder re-threads generics at each `.field()` link and infers progressively worse.
3. **The fluent layer already exists where it belongs — the schema.** `zod`'s `z.string().min(3).regex(…)` **is** the fluent validation DSL (the
   FluentValidation muscle memory the `.NET`-heavy ecosystem wants). Duplicating fluency at the form-config layer is redundant and competes with the schema
   for the same job.
4. **Precedent is unanimous.** Every mature React form lib — TanStack `useForm({…})`, react-hook-form `useForm(options)`, Formik, Mantine `useForm({…})` —
   is options-object. `.NET` fluent builders (FluentValidation, the EF model builder) run **once at startup**; a React hook runs **every render** — the
   runtime models are opposite, so the ergonomic that works in `.NET` is an anti-pattern here.

---

## 5. Vector DONE when — completeness addendum

Extends the [`forms-vector-next.md` §5](./forms-vector-next.md#5-maturity-checklist--forms-vector-done) checklist (field integration · chrome ·
conformance · i18n-ready · interaction tier · patterns · product proofs · DX — unchanged). The vector is complete when, **additionally**:

- [x] **Submit surface complete:** `submitOn` (`change`/`blur`/`manual` + `submitDebounceMs`) and `submitInvalid` ship on both adapters, routed through
      the one `submit()` path, with the concurrent-submit guard — conformance pins the change/blur/manual matrix, the invalid-submit gate, and single-flight
      re-entry. **(2026-07-11)**
- [x] **Validation entry complete:** `form.validate()` (validate-without-submit) and `validateOnMount` ship on both adapters; conformance pins
      validate-only-populates-errors-without-`onSubmit` and initial-validity-on-mount. **(2026-07-11)**
- [x] **Whole-form `isDisabled`** disables every wired control through one provider path + makes submit inert; conformance pins it. **(2026-07-11)**
- [ ] **Every deferral has a live, named trigger** recorded here and mirrored in `docs/planning.md`: async-field-validation (2nd product), warnings channel
      (advisory-validation product), i18n messages (P6 `LocaleProvider`), draft autosave (W2-c storage v2), form devtools (debug pain / consumer ask),
      sub-forms (2nd nested-form product) — none silently forgotten.
- [ ] **Every skip is a documented pattern** in `conventions/…/presentation/forms.md`, not a gap: conditional visibility (`Subscribe`-render),
      field-level permissions (auth × field flags), field-level validators / per-field schema (escape hatch + promotion rule), schema-driven generation
      (separate module, not the contract), configurable error recognizer (`mapSubmitError`).
- [x] **`AppFormOptions` stays a flat options object** (§4) — the fluent-builder question is settled and recorded; the 6 ship-now capabilities all landed
      as option fields (`submitOn` / `submitDebounceMs` / `submitInvalid` / `validateOnMount` / `isDisabled`) + one method (`form.validate()`), no builder.

When these are ticked alongside `forms-vector-next.md` §5, the second product that reaches for forms finds the whole vector present — never re-triggering a
capability question, exactly as the [dev-cycle §Vector completeness](../../../../../conventions/development/dev-cycle.md) doctrine requires.
