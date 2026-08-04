import type { FormEvent, ReactNode } from 'react';

import type { ApiError } from '../foundation/http';
import type { ValidationMessageCatalogue } from '../foundation/validation';

import type { StandardSchemaV1 } from './StandardSchema';
import type { SubmitErrorMap } from './SubmitErrors';

/*
 * The facade contract every engine adapter satisfies (docs/analysis/forms-engine.md §4).
 * Contract types are engine-free; each adapter subpath (`/forms-engine/house`,
 * `/forms-engine/tanstack` — phase 2) exports the same `useAppForm` over its engine.
 * Semantics are pinned by the conformance suite (`conformance/FormEngineContract.shared.tsx`),
 * not just by these signatures.
 */

/** Defines the options every engine adapter accepts. */
export interface AppFormOptions<TValues extends object> {
  /** The initial values. Async prefill (edit screens) stays on `/query` — render the form once loaded, or `reset(data)`. */
  readonly defaultValues: TValues;
  /** The whole-form validator — any Standard Schema (zod / valibot / arktype). Sync or async. */
  readonly schema?: StandardSchemaV1<TValues>;

  // ── validation-config cluster ───────────────────────────────────────────────
  /** When client validation runs. `'submit'` (default) re-validates touched fields on change after the first attempt. */
  readonly validateOn?: 'change' | 'blur' | 'submit';
  /**
   * Validate once on mount — seeds `isValid` / field errors before any interaction (edit-screen
   * validity indicators, wizard step-entry gating). Fields stay untouched (`isTouched` false), so
   * the initial pass populates state without asserting the user has interacted. Default `false`.
   */
  readonly validateOnMount?: boolean;
  /**
   * How a failed client validation gates the submit. `false` (default) blocks `onSubmit` on errors
   * (the client is the gate); `true` validates (errors still populate + render, advisory) but runs
   * `onSubmit` regardless — the **backend is the source of truth**. Belongs here, on the
   * validation-config surface, because it is a validation→submit *gate policy*, not a submit callback.
   * The verdict (`handleSubmit` / `isSubmitSuccessful`) then reflects `onSubmit`'s outcome, not the
   * bypassed client gate.
   */
  readonly submitInvalid?: boolean;

  /** Performs the submit with valid values — usually a `useAppMutation` / `useOptimisticMutation` `mutateAsync`. */
  readonly onSubmit: (values: TValues) => Promise<unknown>;

  // ── submit-config cluster ───────────────────────────────────────────────────
  /**
   * What triggers a submit. `'manual'` (default) = only `handleSubmit` / the `<form onSubmit>` path.
   * `'change'` = any field change schedules a submit (settings / live-save); `'blur'` = submit when a
   * field blurs (save-on-blur). Auto-submits route through the SAME internal submit path as
   * `handleSubmit`, so validation, the `submitInvalid` gate, server-error mapping, the verdict, and
   * the concurrent-submit guard all apply identically. `reset()` / `reset(data)` / prefill never
   * auto-submit — only user-origin writes do. Named `'manual'` (not `'submit'`) so it never reads as
   * a `validateOn` value.
   */
  readonly submitOn?: 'change' | 'blur' | 'manual';
  /** Debounce (ms, trailing) for `submitOn: 'change'` — coalesces a change burst into one submit. Default `0`. Ignored for `'blur'` / `'manual'`. */
  readonly submitDebounceMs?: number;

  /**
   * Disables the whole form — ORs into every `form.Field`'s control-disabled flag (on top of any
   * per-field `isDisabled`) and makes `handleSubmit` / auto-submit inert. For read-only / role-locked
   * screens or a while-related-data-loads freeze. Read per render from the latest options. Default `false`.
   */
  readonly isDisabled?: boolean;
  /**
   * Maps a thrown submit error to `path → failures`. Default: `fieldIssues` (ProblemDetails, both .NET
   * shapes), which keeps each failure's rule code for `messages`. A mapper returning plain strings is
   * still valid — those render as-is.
   */
  readonly mapSubmitError?: (error: unknown) => SubmitErrorMap;
  /** Rewrites a server error path onto a form path. Default: camelCase per segment (`Rules[0].Destination` → `rules[0].destination`). */
  readonly mapFieldPath?: (serverPath: string) => string;
  /**
   * The message used when a submit failure is neither an `ApiError`, an `Error`, nor a
   * string (e.g. a thrown plain object) — the last SDK-authored English literal on the
   * submit path. Override for i18n. Default: `'Unknown error'`.
   */
  readonly fallbackErrorMessage?: string;

  // ── message-catalogue cluster ───────────────────────────────────────────────
  /**
   * Overrides the wording of individual rule codes, merged over `defaultValidationMessages`.
   *
   * The point is ONE voice per rule: a failure the client caught and the same failure the server caught
   * render from the same entry, instead of "Name is required" from one side and "'Name' must not be
   * empty." from the other. Server codes are normalized onto the shared vocabulary on read
   * (`foundation/http` `fieldIssues`), so both sides reach the same key.
   *
   * Applies to server failures always, and to client failures when the schema is a
   * `foundation/validation` validator — a third-party spec schema's codes are erased by the spec, so its
   * messages render as the schema authored them. An unknown code falls back to the source's own message,
   * which is why wiring this can never render a form worse than not wiring it.
   *
   * i18n: swap the whole table per locale off `foundation/i18n`'s `LocaleContext`.
   */
  readonly messages?: ValidationMessageCatalogue;
  /**
   * Display labels per field path, prefixed to a catalogue-rendered message (`rules[].destination` also
   * matches every row). Omitted, messages render as bare fragments — correct under a labelled control,
   * which is why this is opt-in rather than required.
   */
  readonly labels?: Readonly<Record<string, string>>;
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
  /**
   * The last completed submit's verdict as a reactive slice — `true` when validation passed
   * AND `onSubmit` resolved, `false` when validation failed or `onSubmit` threw, `null` before
   * the first completed attempt and after `reset()`. Mirrors `handleSubmit`'s resolved value,
   * so the imperative return and this slice never disagree (success banners subscribe here).
   */
  readonly isSubmitSuccessful: boolean | null;
}

/**
 * Resolves the field value type for a path: top-level keys infer `TValues[name]`;
 * deeper dot/index paths stay `unknown` — loose string paths are the documented
 * contract (typed values, untyped paths), deep typed paths are the tanstack
 * adapter's escape-hatch territory.
 */
export type AppFieldValue<TValues, TPath extends string> = TPath extends keyof TValues
  ? TValues[TPath]
  : unknown;

/** The props `<form.Field>` accepts — a render prop plus the per-mode control flags (R12). */
export interface AppFieldProps<TValues extends object, TPath extends string = string> {
  /** The field path — a top-level key or a dot/index path (`rules[0].destination`). */
  readonly name: TPath;
  /** The per-mode disabled flag, exposed to the control via `FormControlContext`. */
  readonly isDisabled?: boolean;
  /** The per-mode required flag, exposed to the control via `FormControlContext`. */
  readonly isRequired?: boolean;
  /** The per-mode read-only flag, exposed to the control via `FormControlContext`. */
  readonly isReadOnly?: boolean;
  /** Renders the control from the field API. */
  readonly children: (field: AppFieldApi<AppFieldValue<TValues, TPath>>) => ReactNode;
}

/**
 * Field wrapper — always provides `FormControlContext` (id / labelId / errorId / isInvalid /
 * `errors` / isDisabled / isRequired) so the control + chrome auto-wire aria. Label / helper
 * chrome stays with the presentation `Field` composed inside the render prop — it ADOPTS
 * this provider (same ids, inherited flags) and renders the context `errors` without
 * `error={f.errors[0]}` hand-wiring.
 */
export interface AppFieldComponent<TValues extends object> {
  <TPath extends string>(props: AppFieldProps<TValues, TPath>): ReactNode;
}

/** The props `<form.Subscribe>` accepts — a state-slice selector plus a render prop. */
export interface AppSubscribeProps<TValues extends object, TSlice> {
  /** Selects the slice to subscribe to — re-renders only when the selected value changes. */
  readonly selector: (state: AppFormState<TValues>) => TSlice;
  /**
   * Optional equality for the selected slice — return `true` to treat two selections as
   * unchanged and skip the re-render. Defaults to `Object.is`. Pass a shallow-equal for a
   * composite selector (`{a,b,c}`) whose fresh object identity would otherwise defeat the
   * adapter's `Object.is` slice cache and re-render on every store change.
   */
  readonly isEqual?: (a: TSlice, b: TSlice) => boolean;
  /** Renders from the selected slice. */
  readonly children: (slice: TSlice) => ReactNode;
}

/** Render-prop subscription to a state slice (also exposed as the `useFormState(selector)` hook). */
export interface AppSubscribeComponent<TValues extends object> {
  <TSlice>(props: AppSubscribeProps<TValues, TSlice>): ReactNode;
}

/** Array helpers at a path — `push` / `insert` / `remove` / `swap` / `move` (R8). Indices are assumed in range. */
export interface AppArrayApi {
  readonly push: (value: unknown) => void;
  readonly insert: (index: number, value: unknown) => void;
  readonly remove: (index: number) => void;
  readonly swap: (indexA: number, indexB: number) => void;
  readonly move: (fromIndex: number, toIndex: number) => void;
}

/** What `useAppForm` returns — identical across engines; `TEngine` types the escape hatch. */
export interface AppForm<TValues extends object, TEngine = unknown> {
  /** Field wrapper — always provides `FormControlContext` (id / labelId / errorId / isInvalid / `errors` /
   *  isDisabled / isRequired); the presentation `Field` composed inside the render prop adopts it, so
   *  label/helper/error chrome renders from one provider with zero hand-wiring. */
  readonly Field: AppFieldComponent<TValues>;
  /** Render-prop subscription to a state slice (also exposed as the `useFormState(selector)` hook). */
  readonly Subscribe: AppSubscribeComponent<TValues>;
  /**
   * Hook form of `Subscribe` — selector-subscribed state slice. Stable on the form instance,
   * so calling it is rules-of-hooks safe. Pass `isEqual` (defaults to `Object.is`) to keep a
   * composite selector from re-rendering on every store change.
   */
  readonly useFormState: <TSlice>(
    selector: (state: AppFormState<TValues>) => TSlice,
    isEqual?: (a: TSlice, b: TSlice) => boolean,
  ) => TSlice;
  /**
   * Validates, runs `onSubmit`, applies mapped server errors to fields, leaves the remainder
   * in `submitError`. Resolves the verdict — `true` iff validation passed AND `onSubmit`
   * resolved; `false` on validation failure or an `onSubmit` throw. Never rejects, so a
   * `<form onSubmit={form.handleSubmit}>` handler ignores the return while an imperative caller
   * (a wizard-step gate) branches on it. The reactive mirror is `state.isSubmitSuccessful`.
   */
  readonly handleSubmit: (event?: FormEvent) => Promise<boolean>;
  /**
   * Validates the current values WITHOUT submitting — runs the whole-form schema, populates
   * `field.errors`, and marks fields touched so the errors display (the "validate now" gate), then
   * resolves the client validity. `onSubmit` never runs. The clean single-form multi-step gate
   * (`const ok = await form.validate()` before advancing a wizard step) and the imperative
   * "is it valid now" check. Never rejects. Mirrors RHF `trigger` / TanStack `validateAllFields`.
   */
  readonly validate: () => Promise<boolean>;
  /**
   * Writes a value at a path outside a `<form.Field>` render prop — cross-field / derived
   * writes (name → slug) and sibling-group writes. Top-level keys are typed to their value;
   * deeper dot/index paths accept `unknown` (the typed-values / untyped-paths contract rule,
   * mirroring {@link AppFieldValue}). Clears that field's server error like an in-field edit
   * and runs change-time validation under the active `validateOn`.
   */
  readonly setValue: <TPath extends string>(path: TPath, value: AppFieldValue<TValues, TPath>) => void;
  /** Array helpers at a path — `push` / `insert` / `remove` / `swap` / `move` (R8). */
  readonly array: (path: string) => AppArrayApi;
  /** Resets to `defaultValues`, or re-seeds with `next` (edit-mode prefill — kills smart-qr's 13-setter effect). */
  readonly reset: (next?: TValues) => void;
  /** Applies server field errors outside the submit pipeline (e.g. a deferred backend check). Replaces the current server-error overlay. */
  readonly setFieldErrors: (errors: Record<string, string[]>) => void;
  /** Clears the form-level `submitError` (a dismissible error banner's reset) — leaves field errors untouched. */
  readonly clearSubmitError: () => void;
  /** ESCAPE HATCH — the native engine form instance. See the 90/10 rule in docs/analysis/forms-engine.md §4. */
  readonly engine: TEngine;
}

/** The module contract every adapter satisfies — enforced by the conformance suite, swapped by import path. */
export interface FormEngine {
  useAppForm<TValues extends object>(options: AppFormOptions<TValues>): AppForm<TValues>;
}
