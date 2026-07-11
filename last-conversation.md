## Me

```markdown
* for forms we need to analyze more functionality to make it mature
* one more idea I have - enabling automatic updates - for example a field changes - submit is triggered-  this should be configurable just like validation
* for example - validation can be plugged at any point - so forms can work without validation, if validation is added - it continues to work, we can add forms configs to respect validation errors or just send to backend - need to analyze how this can be switched as well ( I guess since this is part of validation itself - respect or not - should be part of validation config as well
* now write a code snippet here for how our forms work right now with sdk - config etc - maybe we have smth to polish with it ( maybe like chain methods configs like we have in .net ?? )
* " W2-c storage v2 (can't build until that lands)" - explain what that is
*
* rfh - react hook form ? what it helps with and how we should implement it ?
* " a consumer asking" - like an app needing it ? I guess we need to add convention so we don't repeat this question ever again - our strategy with sdk is like this - let's say one app needs forms - great sdk provides forms - then that app needs validation -but let's. say sdk doesn't have it yet - now implementing validation takes about 3-5h of development work - first we'll implement it in the app, check it, then extract to sdk, adopt - that's plus 1-2h of work - see the problem ? forms and validations probably were invented like 30-40 years ago ( not exactly react forms validation I mean in general ) - and we still don't have a library to just plug and use it ??? ( ofc we have them in the npm - the problem is, integration with other components from other libraries will take that amount of time, if it wasn't ever in the npm maybe it could took a whole week to implement everything from scratch ) - so what we do ? the goal of this sdk is implement everything ( and I mean everything ) in each vector possible - so that, product a needs forms and we haven't implemented forms yet - good we'll implement but when doing so we'll analyze the whole vector, document every single thing we can integrate with forms ( autosave, validation, error msg spans etc etc ) - so that we'll implement the essential first ship it for product a, and spin a chat to implement the whole vector to complete, so that when product b uses forms from sdk - it should provide probably everything known to universe related to forms ( since it's not a rocket science ) - add a convention for this within the sdk - or even to the claude.md maybe - this is the main frame of the sdk ( for both backend and frontend sdks - you can add it to the both )
* product template - you mean a separate repo containing a template for sdk usage right ? if it's within the sdk ( afaik, we have one to showcase themes ) - you can update that one, we also have one as a separate repo - that one should defer
* i18n sweep - yeah good catch - we could implement this as a separate vector  since it has own components - I want to see where we are documenting this sweep / components vector documents - if not analyze where we should document it so we don't loose different vector tracks
```

## Claude

```markdown
Big message — let me answer each thread, then capture the doctrine + kick off the completeness analysis. First, reading the current config surface + placement for the doctrine:

Answered thread by thread, then I codify the doctrine + launch the completeness analysis.

### How forms work today (real snippet)

```tsx
// src/form.ts — the ONE vendor-touching line in the app
export { useAppForm } from '@wow-two-beta/ui/forms-engine/tanstack';

// ProductForm.schema.ts — validation is OPTIONAL; zod is already fluent where it belongs
export const ProductSchema = z.object({ slug: z.string().min(1, 'Required'), name: z.string().min(1) });

// CreateProduct.tsx
const save = useAppMutation({ mutationFn: registerProduct, invalidates: () => [productKeys.list] });
const form = useAppForm({
  defaultValues: { slug: '', name: '' },
  schema: ProductSchema,          // ← omit entirely → form still works, no validation
  validateOn: 'submit',           // 'change' | 'blur' | 'submit'
  onSubmit: (v) => save.mutateAsync(v),
});
// <form onSubmit={form.handleSubmit}> … <form.Field name="slug">{f => <Field label="Slug"><TextInput …/></Field>}</form.Field>
```

- **Fluent chains like .NET?** Honest take: **no, keep the options object.** A `.NET` builder runs once at startup; a React hook runs *every render* — a fluent chain would rebuild closures each render (identity churn, worse inference). The options object infers `TValues` from `defaultValues` in one shot. The fluent instinct is already satisfied where it belongs — the **zod schema** (`z.string().min().email()`) is the chainable builder. Pluggability = optional *slices*, not a chain.

---

### Your two capability ideas — both are peers of `validateOn`, both additive

- **Auto-submit** → `submitOn?: 'change' | 'blur' | 'manual'` (+ `autoSubmitDebounceMs`). Field changes → submit fires. Configurable exactly like validation. (Distinct from *autosave-to-storage*, which is W2-c.)
- **Respect validation or not** → you're right it's part of *validation* config: `submitInvalid?: boolean` — `false` = block on errors (today's behavior), `true` = validate-but-send-anyway (backend is source of truth). Validation stays fully optional (schema is already optional today).

```tsx
useAppForm({ defaultValues, schema, validateOn: 'blur',
  submitInvalid: false,   // NEW — respect errors (default) vs send anyway
  submitOn: 'change',     // NEW — auto-submit trigger (default 'manual')
  onSubmit });
```

Both small + additive; they go into the completeness map + a build pass.

---

### W2-c storage v2 — what it is

- `foundation/storage` today = a thin `StorageBroker`. **v2** adds: **versioned keys + migrations** (schema-versioned localStorage so a shape change doesn't corrupt old data), a **zustand-persist adapter**, and **autosave primitives**. `prism` hand-rolls ~400 LOC of exactly this.
- Blocks forms **autosave** because draft-to-storage-on-change needs versioned/migratable persistence — building it on raw `localStorage` would be the hand-rolling the module exists to delete.

---

### RHF = react-hook-form

- The most popular React forms lib — **uncontrolled/ref-based**, minimal re-renders, big resolver ecosystem.
- **How we'd add it:** a `/forms-engine/rhf` adapter implementing the same `FormEngine` contract + passing the same 94-case conformance suite (contract already design-checked against RHF v7/v8).
- **But it's a 3rd *engine*, not a capability** — we already have swap-freedom (`house` + `tanstack`). Its uncontrolled model also fights our controlled inputs, and v8 is mid-beta. So RHF is the one thing that *does* wait for preference — see the doctrine distinction below.

---

### Your doctrine — agree completely, codifying it now

Your framing is the SDK's core operating principle, and it corrects the stale "ship adapter only if a consumer asks" line: **the first product is the trigger to build the vector, not the scope.** A known domain (forms, validation, auth, tables) is built to *completeness* proactively — because the real cost is **integration** with the rest of the component set, not invention; pay it once, in the SDK, fully.

- **Capabilities** → built proactively to completeness (autosave, warnings-vs-errors, dependent fields, masking…). **Engine adapters** (RHF beside TanStack) → the lone exception, added on preference once ≥2 exist.
- **Where documented:** `docs/planning.md` **is** the vector tracker (the Vectors table) — i18n gets a row there + its own `docs/analysis/i18n-*.md` when it starts, so no vector track is lost. **product-template:** I'll update the *in-SDK* apps (showcase/theme-studio) later; the *separate* template repo stays deferred, per you.

---

Doing now: (1) writing the doctrine into `dev-cycle.md` + surfacing it in both SDK `CLAUDE.md`s, (2) launching the **forms completeness analysis** — the full "everything known about forms" capability map with per-item verdicts (ship-now / defer-with-trigger / skip), which becomes the mature-the-vector roadmap.

Doctrine in `dev-cycle.md`. Surfacing it in the workspace `CLAUDE.md` (auto-loaded for both SDK contexts):

Doctrine live in both `dev-cycle.md` + workspace `CLAUDE.md`. Launching the forms completeness analysis — the "everything known about forms" map the doctrine now mandates:

Doctrine captured + analysis running. Quick close:

- **Doctrine** now lives in `conventions/development/dev-cycle.md` §*Vector completeness* + surfaced in the workspace `CLAUDE.md` (auto-loaded for both SDK contexts) — capability-completeness is proactive; only alternate *engine* adapters wait on preference
- **In flight:** `forms-completeness.md` — the exhaustive capability map (your `submitOn`/`submitInvalid` slotted in, fluent-vs-options decision recorded, every forms feature verdicted ship-now / defer / skip). Its output = the real remaining forms build list
- **RHF, W2-c, product-template, i18n-tracking** — all answered above; i18n will get its own `docs/planning.md` Vectors row + analysis doc when triggered

When the map lands, we'll have the concrete "what to build to truly finish forms" shortlist — then decide build order. Tree ready for push (doctrine + CLAUDE.md changes are in the meta repo).

Completeness map done: **51 capabilities → 28 shipped · 6 ship-now · 5 defer · 12 skip**. The 6 ship-now are the concrete "finish forms" list — and your two ideas are #1–2. Per the doctrine we just codified (complete the vector), building all 6:

### The completeness map + build in flight

| Verdict | Count |
|---|---|
| shipped | 28 |
| **ship-now (building)** | **6** |
| defer (named trigger) | 5 — async-field-validation · warnings channel · i18n→P6 · autosave→W2-c · devtools |
| skip (userland / other-module) | 12 — incl. schema-driven field-gen + `subForm`, deliberately rejected |

Full map: [forms-completeness.md](workbench/wow-two-sdk-beta/wow-two-sdk-beta.ui/docs/analysis/forms-completeness.md).

---

### The 6 being built (your two are #1–2)

1. **`submitOn` + `submitDebounceMs`** — auto-submit (change/blur/manual); unlocks settings/save-on-blur/live-save forms — the single highest-leverage gap
2. **`submitInvalid`** — validate-but-send-anyway (backend as truth); confirmed a validation-config peer of `validateOn`
3. **Concurrent-submit guard** — re-entry guard (prereq for auto-submit; today's `submit()` can double-POST)
4. **`form.validate(): Promise<boolean>`** — validate-without-submit (clean multi-step gate)
5. **`validateOnMount`** — initial validity for edit/wizard screens
6. **whole-form `isDisabled`**

Settled in the doc too: **options-object, not fluent builder** (a hook re-runs every render → a builder churns closures/loses inference; zod owns the fluent layer — the schema).

On completion → the forms vector is genuinely, fully complete (only trigger-gated defers remain). Note: the meta repo also gained a sibling `sdk-extraction.md` convention — complementary to the doctrine, consistent.

The 6 shipped — forms vector now **100% of ship-now done: 34 shipped · 0 remaining**. Confirming the milestone gate myself:

Milestone confirmed: **1813 green · typecheck/lint/build 0** · all 6 members in the DTS. Updating memory, then the close:

### Forms vector — truly complete (0 ship-now remaining)

- **1813 tests · conformance 94→114 · typecheck/lint/build 0**
- Your two ideas shipped exactly as envisioned: **`submitOn`** (change/blur/manual + `submitDebounceMs`, single submit path) · **`submitInvalid`** (validate-but-send, backend-as-truth) — plus concurrent-submit guard, `form.validate()`, `validateOnMount`, whole-form `isDisabled`
- Nice semantic calls the agent made: concurrent guard **coalesces** re-entrant triggers onto the in-flight promise (both callers see the real verdict, not a fake `false`); `reset()` cancels a pending auto-submit timer; `submitDebounceMs:0` still trails so a sync burst coalesces to latest values

---

### What's genuinely left = only trigger-gated defers

- `async-field-validation` · `warnings channel` (soft messages) · **i18n** → its own vector (P6) · **autosave** → W2-c storage · **devtools**
- 12 skips are userland/other-module (incl. schema-driven field-gen + `subForm` — deliberately rejected)

---

### The bigger outcome

- **The doctrine is codified** (`dev-cycle.md` §Vector completeness + workspace `CLAUDE.md`) and forms is its **first proof** — a vector matured to genuine completeness proactively, not to a product's ask. The completeness-map → ship-now-shortlist → build pattern is now the template for every future vector.
- Meta repo also gained your `sdk-extraction.md` — complementary (what earns SDK placement vs stays inline).

Tree ready for push (SDK: the 6 capabilities; meta: doctrine + conventions). Next lane whenever you are: **W2-b/c** · **S-1 sweep** · **W3** · or apply the completeness doctrine to the next vector.
```
