import { onMounted, onScopeDispose, shallowRef, toValue, type ShallowRef } from 'vue';

import {
  revalidateLogic,
  useForm,
  type DeepKeys,
  type FormApi,
  type FormAsyncValidateOrFn,
  type FormOptions,
  type FormValidateAsyncFn,
  type VueFormApi,
} from '@tanstack/vue-form';

import { fieldIssues } from '../../foundation/http';
import type { ResolveValidationMessage } from '../../foundation/validation';

import type { AppFieldApi, AppForm, AppFormOptions, AppFormOptionsSource, AppFormState } from '../AppForm';
import { deepEqual } from '../DeepEqual';
import { createFieldApi, createFieldComponent, createFormStateView, createUseFormState } from '../FormGlue';
import { getPath, hasPath } from '../Paths';
import { createOptionsMessageResolver, runStandardSchema } from '../SchemaValidation';
import { defaultMapFieldPath, resolveSubmitFailure } from '../SubmitErrors';

import { createTanstackFormOverlay, type TanstackFormOverlay, type TanstackOverlayState } from './TanstackFormOverlay';

/*
 * The tanstack adapter — the facade contract over `@tanstack/vue-form` (optional peer).
 * TanStack owns values, validation scheduling, and the submit lifecycle; the overlay
 * (`TanstackFormOverlay`) owns everything the contract pins that TanStack models
 * differently — server-error merge/clearing, baseline-compared dirty, blur-or-submit
 * touched, contract array reindexing, `submitError` (see the overlay's module doc).
 *
 * Validation wiring: the whole-form Standard Schema runs as a TanStack form-level
 * `onDynamicAsync` validator under `revalidateLogic` — `validateOn` maps 1:1 onto its
 * pre-submission `mode` ('submit' default / 'blur' / 'change'), and `modeAfterSubmission:
 * 'change'` gives the pinned post-attempt change-revalidation. The validator returns
 * TanStack's global `{ form?, fields }` error shape, so client errors land in TanStack
 * field meta (created on demand — no TanStack `Field` mounts needed) and `state.isValid`
 * stays engine-native. Adapter notes (both mirror the contract's static options intent):
 *   - `validateOn` and schema PRESENCE are creation-pinned; the schema VALUE is read
 *     per run, so swapping schema instances through a getter source is honored.
 *   - Escape-hatch writes (`engine.setFieldValue`) bypass the overlay — server-error
 *     clearing and touched semantics then follow TanStack, not the contract.
 *
 * WHAT THE VUE PACKAGE CHANGED. `@tanstack/vue-form` is the same `form-core` under a different
 * host binding, so every call in here is unchanged; what moved is how state is READ.
 *   - `ReactFormExtendedApi` has no Vue twin — the returned instance is `FormApi & VueFormApi`.
 *   - TanStack's store is a `@tanstack/store` `Store`, invisible to Vue's tracker. It is bridged
 *     ONCE, here, into a `shallowRef` (`bridgeStore`); every contract read then flows through
 *     Vue reactivity. `form.useSelector` would do the same per slice, but it wraps its ref in
 *     `readonly()`, which would hand values back through a proxy and break the identity compares
 *     the reader and `deepEqual` rely on.
 *   - `useForm` applies its options ONCE (Vue's `setup` runs once), where React re-applied them
 *     every render. The stable-options dance survives anyway because `reset()` still has to keep
 *     `tanstackOptions.defaultValues` in step with TanStack's own copy.
 */

/** The native TanStack form instance the adapter builds — what `form.engine` exposes. */
export type TanstackFormEngine<TValues extends object> = FormApi<
  TValues,
  undefined, // onMount
  undefined, // onChange
  undefined, // onChangeAsync
  undefined, // onBlur
  undefined, // onBlurAsync
  undefined, // onSubmit
  undefined, // onSubmitAsync
  undefined, // onDynamic
  FormAsyncValidateOrFn<TValues>, // onDynamicAsync — the adapter's schema bridge
  undefined, // onServer
  never // submitMeta
> &
  VueFormApi<
    TValues,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    FormAsyncValidateOrFn<TValues>,
    undefined,
    never
  >;

type TanstackFormOptions<TValues extends object> = FormOptions<
  TValues,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  FormAsyncValidateOrFn<TValues>,
  undefined,
  never
>;

const EMPTY_MESSAGES: readonly string[] = Object.freeze([]);

/**
 * Folds the shared schema-error map into TanStack's global form error shape:
 * root-path (`''`) issues become the form-level error, the rest per-field errors.
 */
function toEngineValidationError(errors: Record<string, string[]>): unknown {
  const paths = Object.keys(errors);
  if (paths.length === 0) return undefined;
  const fields: Record<string, string[]> = {};
  let form: string[] | undefined;
  for (const path of paths) {
    if (path === '') form = errors[path];
    else fields[path] = errors[path] ?? [];
  }
  return form ? { form, fields } : { fields };
}

/**
 * Normalizes TanStack field-meta errors to plain messages. The adapter's own validator
 * yields `string[]`, but escape-hatch validators may add strings, nested arrays, or
 * Standard Schema issue objects — all are accepted.
 */
function toMessages(errors: ReadonlyArray<unknown> | undefined): readonly string[] {
  if (!errors || errors.length === 0) return EMPTY_MESSAGES;
  const messages: string[] = [];
  const visit = (error: unknown): void => {
    if (error === null || error === undefined) return;
    if (typeof error === 'string') {
      messages.push(error);
      return;
    }
    if (Array.isArray(error)) {
      for (const entry of error) visit(entry);
      return;
    }
    if (typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
      messages.push((error as { message: string }).message);
    }
  };
  for (const error of errors) visit(error);
  return messages.length > 0 ? messages : EMPTY_MESSAGES;
}

/** The per-field slice the `Field` glue reads — identity-stable while its members are unchanged. */
interface TanstackFieldState {
  readonly value: unknown;
  readonly errors: readonly string[];
  readonly isDirty: boolean;
  readonly isTouched: boolean;
}

/** The minimal structural view of TanStack form state the reader consumes (loose string paths). */
interface EngineStateView {
  readonly values: unknown;
  readonly isValid: boolean;
  readonly isValidating: boolean;
  readonly isFormValidating: boolean;
  readonly fieldMeta: Partial<Record<string, { readonly errors: ReadonlyArray<unknown> }>>;
}

function sameMessages(a: readonly string[], b: readonly string[]): boolean {
  return a === b || (a.length === b.length && a.every((message, index) => message === b[index]));
}

function fieldStatesEqual(a: TanstackFieldState, b: TanstackFieldState): boolean {
  return (
    Object.is(a.value, b.value) &&
    a.isDirty === b.isDirty &&
    a.isTouched === b.isTouched &&
    sameMessages(a.errors, b.errors)
  );
}

/**
 * Mirrors the `@tanstack/store` store into a `shallowRef` — the ONE seam that puts TanStack
 * state inside Vue's tracker. Deliberately not `useSelector`/`useStore` from
 * `@tanstack/vue-store`: those wrap the ref in `readonly()`, which would hand every read back
 * through a deep proxy and defeat the `Object.is` identity compares the reader, `deepEqual`, and
 * TanStack's own writes all depend on.
 */
function bridgeStore<TValues extends object>(engine: TanstackFormEngine<TValues>): ShallowRef<EngineStateView> {
  const snapshot = shallowRef(engine.store.state as unknown as EngineStateView);
  const subscription = engine.store.subscribe((next) => {
    snapshot.value = next as unknown as EngineStateView;
  });
  onScopeDispose(() => subscription.unsubscribe(), true);
  return snapshot;
}

interface CombinedReader<TValues extends object> {
  readonly getFormState: () => AppFormState<TValues>;
  readonly getFieldState: (path: string) => TanstackFieldState;
}

/**
 * Derives the contract state from the (TanStack store state, overlay state) pair with
 * generation caching: snapshots are rebuilt only when either source commits, and per-path
 * field slices reuse the previous generation's identity when unchanged — so a read stays
 * referentially stable between commits. Both sources are `shallowRef`s, so every read below
 * is also the subscription.
 */
function createCombinedReader<TValues extends object>(
  snapshot: ShallowRef<EngineStateView>,
  overlay: TanstackFormOverlay<TValues>,
): CombinedReader<TValues> {
  let generation: { tan: EngineStateView; ov: TanstackOverlayState<TValues> } | null = null;
  let formState: AppFormState<TValues> | null = null;
  let fieldCache = new Map<string, TanstackFieldState>();
  let previousFieldCache = new Map<string, TanstackFieldState>();

  function currentGeneration(): { tan: EngineStateView; ov: TanstackOverlayState<TValues> } {
    const tan = snapshot.value;
    const ov = overlay.state.value;
    if (generation && generation.tan === tan && generation.ov === ov) return generation;
    generation = { tan, ov };
    formState = null;
    previousFieldCache = fieldCache;
    fieldCache = new Map();
    return generation;
  }

  return {
    getFormState: () => {
      const { tan, ov } = currentGeneration();
      formState ??= {
        values: tan.values as TValues,
        isDirty: !deepEqual(tan.values, ov.baseline),
        // Client validity is engine-native; the server-error overlay holds it false too.
        isValid: tan.isValid && Object.keys(ov.serverErrors).length === 0,
        isSubmitting: ov.isSubmitting,
        // Whole-schema validation is a FORM-level validator — TanStack's derived
        // `isValidating` counts field-level validators only, so merge both flags.
        isValidating: tan.isFormValidating || tan.isValidating,
        submitError: ov.submitError,
        isSubmitSuccessful: ov.isSubmitSuccessful,
      };
      return formState;
    },
    getFieldState: (path) => {
      const { tan, ov } = currentGeneration();
      const cached = fieldCache.get(path);
      if (cached) return cached;
      const value = getPath(tan.values, path);
      const clientMessages = toMessages(tan.fieldMeta[path]?.errors);
      const serverMessages = ov.serverErrors[path] ?? EMPTY_MESSAGES;
      const computed: TanstackFieldState = {
        value,
        // Client + server messages merged, client first (contract JSDoc).
        errors:
          serverMessages.length === 0
            ? clientMessages
            : clientMessages.length === 0
              ? serverMessages
              : [...clientMessages, ...serverMessages],
        isDirty: !deepEqual(value, getPath(ov.baseline, path)),
        // A submit attempt counts as touching everything — error-display gating works post-attempt.
        isTouched: ov.touched.has(path) || ov.submitCount > 0,
      };
      const previous = previousFieldCache.get(path);
      const stable = previous && fieldStatesEqual(previous, computed) ? previous : computed;
      fieldCache.set(path, stable);
      return stable;
    },
  };
}

interface AdapterPrelude<TValues extends object> {
  readonly getOptions: () => AppFormOptions<TValues>;
  readonly overlay: TanstackFormOverlay<TValues>;
  readonly tanstackOptions: TanstackFormOptions<TValues>;
  /** The form's message resolver, memoized against the `messages` / `labels` option identities. */
  readonly messageResolver: () => ResolveValidationMessage;
}

/** Builds the overlay + the stable TanStack options (all callbacks read the latest options through `getOptions`). */
function createAdapterPrelude<TValues extends object>(
  getOptions: () => AppFormOptions<TValues>,
): AdapterPrelude<TValues> {
  const initialOptions = getOptions();
  const overlay = createTanstackFormOverlay<TValues>(initialOptions.defaultValues);
  const messageResolver = createOptionsMessageResolver(getOptions);

  const tanstackOptions: TanstackFormOptions<TValues> = {
    defaultValues: initialOptions.defaultValues,
    onSubmit: async ({ value }) => {
      // The contract's `isSubmitting` brackets ONLY the app submit call (house-identical),
      // not TanStack's validation window. Failures propagate to the adapter's
      // `handleSubmit` catch, so TanStack's own submit lifecycle stays truthful.
      overlay.setSubmitting(true);
      try {
        await getOptions().onSubmit(value);
        // Reached only when validation passed AND the app submit resolved — the verdict's
        // sole success signal (the invalid path never runs this; a throw skips it).
        overlay.setSubmitSuccessful(true);
      } finally {
        overlay.setSubmitting(false);
      }
    },
  };

  if (initialOptions.schema) {
    const validateWithSchema: FormValidateAsyncFn<TValues> = async ({ value }) => {
      const schema = getOptions().schema;
      if (!schema) return undefined;
      return toEngineValidationError(await runStandardSchema(schema, value, messageResolver()));
    };
    tanstackOptions.validators = { onDynamicAsync: validateWithSchema };
    tanstackOptions.validationLogic = revalidateLogic({
      // `validateOn` maps 1:1 onto the pre-submission mode; after the first attempt
      // every mode re-validates on change so errors clear as the user fixes them.
      mode: initialOptions.validateOn ?? 'submit',
      modeAfterSubmission: 'change',
    });
  }

  return { getOptions, overlay, tanstackOptions, messageResolver };
}

/** What `buildAppForm` returns — the contract surface plus the teardown the adapter's own timer needs. */
interface BuiltForm<TValues extends object> {
  readonly form: AppForm<TValues, TanstackFormEngine<TValues>>;
  /** Releases the pending `submitOn: 'change'` debounce timer on scope teardown. */
  readonly dispose: () => void;
}

/** Builds the stable contract surface over the TanStack engine + overlay pair. */
function buildAppForm<TValues extends object>(
  engine: TanstackFormEngine<TValues>,
  prelude: AdapterPrelude<TValues>,
): BuiltForm<TValues> {
  const { getOptions, overlay, tanstackOptions, messageResolver } = prelude;
  const reader = createCombinedReader(bridgeStore(engine), overlay);

  // ── Submit path shared by `handleSubmit` + auto-submit (validate → onSubmit → map failure) ─────
  /** Resolves a thrown submit failure onto the overlay (matched paths → fields, remainder → banner). */
  function applySubmitFailure(error: unknown): void {
    const options = getOptions();
    const values = engine.store.state.values;
    overlay.applySubmitFailure(
      resolveSubmitFailure(
        error,
        options.mapSubmitError ?? fieldIssues,
        options.mapFieldPath ?? defaultMapFieldPath,
        (path) => hasPath(values, path),
        options.fallbackErrorMessage,
        messageResolver(),
      ),
    );
  }

  /** Runs the app `onSubmit` inside the contract's `isSubmitting` bracket (the `submitInvalid` path). */
  async function runOnSubmit(): Promise<boolean> {
    overlay.setSubmitting(true);
    try {
      await getOptions().onSubmit(engine.store.state.values);
      overlay.setSubmitSuccessful(true);
      return true;
    } catch (error) {
      applySubmitFailure(error);
      overlay.setSubmitSuccessful(false);
      return false;
    } finally {
      overlay.setSubmitting(false);
    }
  }

  async function performSubmit(): Promise<boolean> {
    // A whole-form disabled form is inert — no attempt, no onSubmit (read-only / role-locked / frozen).
    if (getOptions().isDisabled) return false;
    // A new attempt clears the previous server errors/submitError, re-arms the verdict, touches all.
    overlay.beginSubmitAttempt();

    if (getOptions().submitInvalid) {
      // Backend-as-source-of-truth: always validate (advisory errors populate + render), then run
      // `onSubmit` regardless of validity — the verdict reflects `onSubmit`, not the client gate.
      await engine.validate('submit');
      return runOnSubmit();
    }

    // Default — TanStack gates `onSubmit` on validity; a valid pass runs the wrapper `onSubmit`.
    let succeeded = false;
    try {
      await engine.handleSubmit();
      // The wrapper `onSubmit` flips the verdict true only on a valid + resolved submit;
      // an invalid attempt leaves it `null` (no throw, `onSubmit` never ran).
      succeeded = overlay.getState().isSubmitSuccessful === true;
    } catch (error) {
      // TanStack rethrows `onSubmit` failures — resolve them here so the contract's
      // `handleSubmit` never rejects and no server message silently disappears.
      applySubmitFailure(error);
      succeeded = false;
    }
    // Settle the verdict — the invalid path's `null` becomes `false`; success is idempotent.
    overlay.setSubmitSuccessful(succeeded);
    return succeeded;
  }

  /**
   * Single-flight submit — while a run is in flight a re-entrant trigger (double-click / Enter-spam /
   * a `submitOn: 'change'` burst) coalesces onto it instead of starting a second `onSubmit`.
   */
  let inFlight: Promise<boolean> | null = null;
  async function guardedSubmit(): Promise<boolean> {
    if (inFlight) return inFlight;
    const run = performSubmit();
    inFlight = run;
    try {
      return await run;
    } finally {
      inFlight = null;
    }
  }

  /** Validate without submitting — marks touched, runs the whole-form schema, resolves client validity. */
  async function validate(): Promise<boolean> {
    overlay.touchAll();
    await engine.validate('submit');
    return engine.store.state.isValid;
  }

  // ── Auto-submit (`submitOn`) — routes through the SAME `guardedSubmit` as manual submit ────────
  let autoSubmitTimer: ReturnType<typeof setTimeout> | null = null;
  const clearAutoSubmitTimer = (): void => {
    if (autoSubmitTimer !== null) {
      clearTimeout(autoSubmitTimer);
      autoSubmitTimer = null;
    }
  };
  const scheduleAutoSubmit = (): void => {
    if ((getOptions().submitOn ?? 'manual') !== 'change') return;
    clearAutoSubmitTimer();
    const delay = getOptions().submitDebounceMs ?? 0;
    autoSubmitTimer = setTimeout(() => {
      autoSubmitTimer = null;
      void guardedSubmit();
    }, delay);
  };
  const autoSubmitOnBlur = (): void => {
    if ((getOptions().submitOn ?? 'manual') === 'blur') void guardedSubmit();
  };

  // One API object per path (React memoized the same thing inside its per-field hook).
  const fieldApis = new Map<string, AppFieldApi<unknown>>();
  const fieldOps = {
    getState: (path: string) => reader.getFieldState(path),
    setValue: (path: string, value: unknown) => {
      // Server messages clear on the next change to the field (contract JSDoc).
      overlay.clearServerErrorsAt(path);
      // Triggers TanStack 'change'-cause validation, gated by `revalidateLogic`.
      engine.setFieldValue(path as DeepKeys<TValues>, value as never);
      // `submitOn: 'change'` — a user-origin write schedules the debounced auto-submit.
      scheduleAutoSubmit();
    },
    blur: (path: string) => {
      overlay.markBlurred(path);
      // 'blur'-cause validation — runs the schema only in `validateOn: 'blur'` mode.
      void engine.validateField(path as DeepKeys<TValues>, 'blur');
      // `submitOn: 'blur'` — save-on-blur.
      autoSubmitOnBlur();
    },
  };
  const getFieldApi = (path: string): AppFieldApi<unknown> => {
    const existing = fieldApis.get(path);
    if (existing) return existing;
    const api = createFieldApi(path, fieldOps);
    fieldApis.set(path, api);
    return api;
  };

  const arrayOperation = (path: string, operation: Parameters<typeof overlay.remapForArrayOperation>[1]): void => {
    // TanStack's array ops are constrained to its typed array paths (`DeepKeysOfType`); the
    // contract's paths are loose strings, so the vendor's path algebra is opted out of with
    // `never` rather than reimplemented here.
    const field = path as never;
    switch (operation.kind) {
      case 'push':
        engine.pushFieldValue(field, operation.value as never);
        break;
      case 'insert':
        void engine.insertFieldValue(field, operation.index, operation.value as never);
        break;
      case 'remove':
        void engine.removeFieldValue(field, operation.index);
        break;
      case 'swap':
        engine.swapFieldValues(field, operation.indexA, operation.indexB);
        break;
      case 'move':
        engine.moveFieldValues(field, operation.fromIndex, operation.toIndex);
        break;
    }
    // Contract reindexing for the overlay: row-scoped server errors + touched marks
    // follow their rows. TanStack shifts its OWN field meta by its rules; where they
    // differ, the contract wins because errors/touched surface from the overlay and
    // client errors are recomputed by the op's change-revalidation.
    overlay.remapForArrayOperation(path, operation);
    scheduleAutoSubmit();
  };

  const state = createFormStateView<TValues>(reader.getFormState);

  const form: AppForm<TValues, TanstackFormEngine<TValues>> = {
    Field: createFieldComponent<TValues>(getFieldApi, () => getOptions().isDisabled ?? false),
    state,
    // The same computed `state.values` reads — `form.values` is a shorthand, never a second source.
    get values() {
      return state.values;
    },
    useFormState: createUseFormState<TValues>(reader.getFormState),
    handleSubmit: async (event?: Event) => {
      event?.preventDefault();
      return guardedSubmit();
    },
    validate,
    setValue: (path, value) => {
      // Server messages clear on the next change to the field (contract JSDoc) — mirror the
      // in-field `setValue`; TanStack's 'change'-cause validation runs under `revalidateLogic`.
      overlay.clearServerErrorsAt(path);
      engine.setFieldValue(path as DeepKeys<TValues>, value as never);
      scheduleAutoSubmit();
    },
    array: (path: string) => ({
      push: (value: unknown) => arrayOperation(path, { kind: 'push', value }),
      insert: (index: number, value: unknown) => arrayOperation(path, { kind: 'insert', index, value }),
      remove: (index: number) => arrayOperation(path, { kind: 'remove', index }),
      swap: (indexA: number, indexB: number) => arrayOperation(path, { kind: 'swap', indexA, indexB }),
      move: (fromIndex: number, toIndex: number) => arrayOperation(path, { kind: 'move', fromIndex, toIndex }),
    }),
    reset: (next?: TValues) => {
      const values = next ?? getOptions().defaultValues;
      // Keep the options object TanStack was created with in sync: its own `reset(values)`
      // rewrites `options.defaultValues`, and any later `update()` would otherwise clobber the
      // re-seeded values back from the stale copy.
      tanstackOptions.defaultValues = values;
      overlay.reset(values);
      engine.reset(values);
      clearAutoSubmitTimer(); // a reset/prefill never auto-submits — drop any pending trailing submit
    },
    setFieldErrors: (errors: Record<string, string[]>) => overlay.replaceServerErrors(errors),
    clearSubmitError: () => overlay.clearSubmitError(),
    engine,
  };

  return { form, dispose: clearAutoSubmitTimer };
}

/**
 * The tanstack adapter's `useAppForm` — the facade contract over `@tanstack/vue-form`.
 * The returned form object is stable for the owning scope's lifetime and every state member on
 * it is a live getter, so `form.values.title` / `form.state.isSubmitting` read in a template ARE
 * the subscription; `form.engine` exposes the native {@link TanstackFormEngine} (the 90/10
 * escape hatch — typed here, `unknown` on the shared contract), including TanStack's typed
 * deep-path `Field`/`Subscribe` and per-field validator graph.
 *
 * Call it in `setup()`: `useForm` registers an `onMounted` of its own, and the store bridge +
 * the pending `submitOn: 'change'` timer release on scope teardown.
 */
export function useAppForm<TValues extends object>(
  options: AppFormOptionsSource<TValues>,
): AppForm<TValues, TanstackFormEngine<TValues>> {
  const prelude = createAdapterPrelude<TValues>(() => toValue(options));
  const engine = useForm(prelude.tanstackOptions) as TanstackFormEngine<TValues>;
  const built = buildAppForm<TValues>(engine, prelude);

  // Validate once on mount when flagged — seeds `isValid` / field errors WITHOUT marking touched
  // (the mount pass shows validity without asserting the user interacted).
  onMounted(() => {
    if (toValue(options).validateOnMount) void engine.validate('submit');
  });
  onScopeDispose(built.dispose, true);

  return built.form;
}
