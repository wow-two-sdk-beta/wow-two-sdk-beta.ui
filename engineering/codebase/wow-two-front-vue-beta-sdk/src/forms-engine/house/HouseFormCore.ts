import { shallowRef, type ShallowRef } from 'vue';

import { fieldIssues, type ApiError } from '../../foundation/http';

import type { AppFormOptions, AppFormState } from '../AppForm';
import { deepEqual } from '../DeepEqual';
import { getPath, hasPath, mutateRows, remapPathMap, remapPathSet, setPath, type ArrayOperation } from '../Paths';
import { createOptionsMessageResolver, runStandardSchema } from '../SchemaValidation';
import { defaultMapFieldPath, resolveSubmitFailure } from '../SubmitErrors';

/*
 * The house micro-store — one immutable state object in a `shallowRef`.
 * SCOPE CEILING (docs/analysis/forms-engine.md §7): flat + dot-path store, whole-schema
 * Standard Schema validation, arrays, dirty/touched, submit pipeline. NO typed deep
 * paths, NO per-field async/debounce validators, NO linked-field graphs — a form that
 * needs those uses the tanstack adapter. Grow this file only from product evidence;
 * everything else is the `form.engine` escape hatch.
 *
 * REACT'S EXTERNAL-STORE PLUMBING IS GONE. `listeners` + `subscribe` + `useSyncExternalStore`
 * existed to make a plain object notify React; here `commit` assigns a `shallowRef` and any
 * getter that reads it is tracked wherever it is read. Everything else survives: state stays
 * ONE frozen-by-convention object replaced whole, and the generation caching below still hands
 * out identity-stable per-path slices so a field re-renders only when its own slice changed.
 */

type ErrorMap = Readonly<Record<string, readonly string[]>>;

const EMPTY_ERRORS: readonly string[] = Object.freeze([]);
const EMPTY_MAP: ErrorMap = Object.freeze({});

/** The per-field slice the `Field` glue reads — identity-stable while its members are unchanged. */
export interface HouseFieldState {
  readonly value: unknown;
  readonly errors: readonly string[];
  readonly isDirty: boolean;
  readonly isTouched: boolean;
}

interface InternalState<TValues extends object> {
  readonly values: TValues;
  /** The dirty baseline — `reset(next)` re-seeds it. */
  readonly baseline: TValues;
  readonly clientErrors: ErrorMap;
  readonly serverErrors: ErrorMap;
  /** Merged per-path messages, client first — rebuilt whenever either source changes. */
  readonly errors: ErrorMap;
  readonly touched: ReadonlySet<string>;
  readonly submitCount: number;
  readonly isSubmitting: boolean;
  readonly isValidating: boolean;
  readonly submitError: ApiError | null;
  /** The last completed submit's verdict — `null` until the first attempt completes and after `reset()`. */
  readonly isSubmitSuccessful: boolean | null;
}

/** The native house form instance — what `form.engine` exposes on the house adapter. */
export interface HouseFormEngine<TValues extends object> {
  /**
   * The raw store. Reading `state.value` inside a `computed` / render / `watchEffect` subscribes
   * to it — the reactive seam that replaces React's `subscribe` + `useSyncExternalStore` pair.
   */
  readonly state: Readonly<ShallowRef<unknown>>;
  readonly getFormState: () => AppFormState<TValues>;
  readonly getFieldState: (path: string) => HouseFieldState;
  readonly setValue: (path: string, value: unknown) => void;
  readonly blurField: (path: string) => void;
  readonly applyArrayOperation: (path: string, operation: ArrayOperation) => void;
  readonly reset: (next?: TValues) => void;
  readonly setFieldErrors: (errors: Record<string, string[]>) => void;
  readonly clearSubmitError: () => void;
  readonly submit: () => Promise<boolean>;
  /** Validates without submitting — populates errors, marks touched, resolves client validity. */
  readonly validate: () => Promise<boolean>;
  /** Releases the pending auto-submit timer (`submitOn: 'change'`) on scope teardown. */
  readonly dispose: () => void;
}

function mergeErrors(client: ErrorMap, server: ErrorMap): ErrorMap {
  const clientKeys = Object.keys(client);
  const serverKeys = Object.keys(server);
  if (serverKeys.length === 0) return client;
  if (clientKeys.length === 0) return server;
  const merged: Record<string, readonly string[]> = { ...client };
  for (const key of serverKeys) {
    const existing = merged[key];
    merged[key] = existing ? [...existing, ...(server[key] ?? [])] : (server[key] ?? EMPTY_ERRORS);
  }
  return merged;
}

function sameMessages(a: readonly string[], b: readonly string[]): boolean {
  return a === b || (a.length === b.length && a.every((message, index) => message === b[index]));
}

function fieldStatesEqual(a: HouseFieldState, b: HouseFieldState): boolean {
  return (
    Object.is(a.value, b.value) &&
    a.isDirty === b.isDirty &&
    a.isTouched === b.isTouched &&
    sameMessages(a.errors, b.errors)
  );
}

function normalizeErrorMap(errors: Record<string, string[]>): ErrorMap {
  const normalized: Record<string, readonly string[]> = {};
  for (const [path, messages] of Object.entries(errors)) normalized[path] = [...messages];
  return normalized;
}

/** Creates the house form store. `getOptions` reads the latest options (`AppFormOptionsSource`). */
export function createHouseFormEngine<TValues extends object>(
  getOptions: () => AppFormOptions<TValues>,
): HouseFormEngine<TValues> {
  const initialValues = getOptions().defaultValues;

  const store = shallowRef<InternalState<TValues>>({
    values: initialValues,
    baseline: initialValues,
    clientErrors: EMPTY_MAP,
    serverErrors: EMPTY_MAP,
    errors: EMPTY_MAP,
    touched: new Set<string>(),
    submitCount: 0,
    isSubmitting: false,
    isValidating: false,
    submitError: null,
    isSubmitSuccessful: null,
  });

  /** The generation the caches below belong to — swapped lazily on the first read after a commit. */
  let generation: InternalState<TValues> | null = null;
  let formState: AppFormState<TValues> | null = null;
  /** Per-path field slices for the current generation, rebuilt lazily and reusing identity when unchanged. */
  let fieldCache = new Map<string, HouseFieldState>();
  let previousFieldCache = new Map<string, HouseFieldState>();
  /** Monotonic guard: only the newest validation run may apply its result (async schemas). */
  let validationEpoch = 0;
  /** The pending trailing-debounce auto-submit timer (`submitOn: 'change'`); cleared on reset / teardown. */
  let autoSubmitTimer: ReturnType<typeof setTimeout> | null = null;
  /** Single-flight latch: an in-flight submit coalesces re-entrant triggers (double-click / change-burst). */
  let inFlight: Promise<boolean> | null = null;
  /** The form's message resolver, memoized against the `messages` / `labels` option identities. */
  const messageResolver = createOptionsMessageResolver(getOptions);

  /**
   * Reads the store — THE reactive dependency every getter below inherits — and rolls the cache
   * generation when it has moved. React did this eagerly in `commit`; doing it on read keeps the
   * commit path free of work no one may look at.
   */
  function currentState(): InternalState<TValues> {
    const internal = store.value;
    if (generation !== internal) {
      generation = internal;
      formState = null;
      previousFieldCache = fieldCache;
      fieldCache = new Map();
    }
    return internal;
  }

  /** The untracked read — for the imperative paths (submit, validation, actions), which must never subscribe. */
  function peek(): InternalState<TValues> {
    return store.value;
  }

  function buildFormState(internal: InternalState<TValues>): AppFormState<TValues> {
    return {
      values: internal.values,
      isDirty: !deepEqual(internal.values, internal.baseline),
      isValid: Object.keys(internal.errors).length === 0,
      isSubmitting: internal.isSubmitting,
      isValidating: internal.isValidating,
      submitError: internal.submitError,
      isSubmitSuccessful: internal.isSubmitSuccessful,
    };
  }

  function commit(next: InternalState<TValues>): void {
    store.value = next;
  }

  function patch(partial: Partial<InternalState<TValues>>): void {
    const next = { ...peek(), ...partial };
    const errorsChanged = partial.clientErrors !== undefined || partial.serverErrors !== undefined;
    commit(errorsChanged ? { ...next, errors: mergeErrors(next.clientErrors, next.serverErrors) } : next);
  }

  function currentOptions(): AppFormOptions<TValues> {
    return getOptions();
  }

  function shouldValidateOnChange(): boolean {
    const validateOn = currentOptions().validateOn ?? 'submit';
    // 'submit' (default) + 'blur' both re-validate on change after the first attempt,
    // so errors clear as the user fixes them.
    return validateOn === 'change' || peek().submitCount > 0;
  }

  function clearAutoSubmitTimer(): void {
    if (autoSubmitTimer !== null) {
      clearTimeout(autoSubmitTimer);
      autoSubmitTimer = null;
    }
  }

  /**
   * Schedules a trailing-debounced auto-submit for `submitOn: 'change'` — a user-origin write
   * calls this; a change burst coalesces onto one submit (the timer resets each write), and the
   * single-flight guard drops any overlap. No-op for `'blur'` / `'manual'`. `reset()` cancels it.
   */
  function scheduleAutoSubmit(): void {
    if ((currentOptions().submitOn ?? 'manual') !== 'change') return;
    clearAutoSubmitTimer();
    const delay = currentOptions().submitDebounceMs ?? 0;
    autoSubmitTimer = setTimeout(() => {
      autoSubmitTimer = null;
      void submit();
    }, delay);
  }

  /** Runs whole-schema validation; sync schemas apply synchronously, async ones flip `isValidating`. */
  function runValidation(): Record<string, string[]> | Promise<Record<string, string[]>> {
    const epoch = ++validationEpoch;
    const schema = currentOptions().schema;
    if (!schema) {
      if (Object.keys(peek().clientErrors).length > 0 || peek().isValidating) {
        patch({ clientErrors: EMPTY_MAP, isValidating: false });
      }
      return {};
    }
    const outcome = runStandardSchema(schema, peek().values, messageResolver());
    if (outcome instanceof Promise) {
      if (!peek().isValidating) patch({ isValidating: true });
      return outcome.then((errors) => {
        if (epoch === validationEpoch) patch({ clientErrors: normalizeErrorMap(errors), isValidating: false });
        return errors;
      });
    }
    patch({ clientErrors: normalizeErrorMap(outcome), isValidating: false });
    return outcome;
  }

  function getFieldState(path: string): HouseFieldState {
    const state = currentState();
    const cached = fieldCache.get(path);
    if (cached) return cached;
    const value = getPath(state.values, path);
    const computed: HouseFieldState = {
      value,
      errors: state.errors[path] ?? EMPTY_ERRORS,
      isDirty: !deepEqual(value, getPath(state.baseline, path)),
      // A submit attempt counts as touching everything — error-display gating works post-attempt.
      isTouched: state.touched.has(path) || state.submitCount > 0,
    };
    const previous = previousFieldCache.get(path);
    const stable = previous && fieldStatesEqual(previous, computed) ? previous : computed;
    fieldCache.set(path, stable);
    return stable;
  }

  function setValue(path: string, value: unknown): void {
    const state = peek();
    // Server messages clear on the next change to the field (contract JSDoc).
    const serverErrors = Object.prototype.hasOwnProperty.call(state.serverErrors, path)
      ? Object.fromEntries(Object.entries(state.serverErrors).filter(([key]) => key !== path))
      : state.serverErrors;
    patch({ values: setPath(state.values, path, value), serverErrors });
    if (shouldValidateOnChange()) void runValidation();
    scheduleAutoSubmit();
  }

  function blurField(path: string): void {
    const state = peek();
    if (!state.touched.has(path)) {
      const touched = new Set(state.touched);
      touched.add(path);
      patch({ touched });
    }
    const options = currentOptions();
    if ((options.validateOn ?? 'submit') === 'blur') void runValidation();
    if ((options.submitOn ?? 'manual') === 'blur') void submit();
  }

  function applyArrayOperation(path: string, operation: ArrayOperation): void {
    const state = peek();
    const current = getPath(state.values, path);
    const rows: unknown[] = Array.isArray(current) ? [...(current as unknown[])] : [];
    mutateRows(rows, operation);
    patch({
      values: setPath(state.values, path, rows),
      // Row-scoped errors + touched marks follow their rows (insert/remove/swap/move reindex).
      clientErrors: remapPathMap(state.clientErrors, path, operation),
      serverErrors: remapPathMap(state.serverErrors, path, operation),
      touched: remapPathSet(state.touched, path, operation),
    });
    if (shouldValidateOnChange()) void runValidation();
    scheduleAutoSubmit();
  }

  function reset(next?: TValues): void {
    validationEpoch += 1; // drop any in-flight validation result
    clearAutoSubmitTimer(); // a reset/prefill never auto-submits — drop any pending trailing submit
    const values = next ?? currentOptions().defaultValues;
    commit({
      values,
      baseline: values,
      clientErrors: EMPTY_MAP,
      serverErrors: EMPTY_MAP,
      errors: EMPTY_MAP,
      touched: new Set<string>(),
      submitCount: 0,
      isSubmitting: peek().isSubmitting, // an in-flight submit still owns its flag (its finally clears it)
      isValidating: false,
      submitError: null,
      isSubmitSuccessful: null,
    });
  }

  function setFieldErrorsAction(errors: Record<string, string[]>): void {
    patch({ serverErrors: normalizeErrorMap(errors) });
  }

  function clearSubmitError(): void {
    if (peek().submitError !== null) patch({ submitError: null });
  }

  async function performSubmit(): Promise<boolean> {
    // A whole-form disabled form is inert — no attempt, no onSubmit (read-only / role-locked / frozen).
    if (currentOptions().isDisabled) return false;
    // A new attempt clears the previous server errors + remainder and re-arms the verdict.
    patch({
      submitCount: peek().submitCount + 1,
      serverErrors: EMPTY_MAP,
      submitError: null,
      isSubmitSuccessful: null,
    });
    const errors = await runValidation();
    // `submitInvalid` (default false) blocks onSubmit on client errors; `true` runs onSubmit anyway
    // (the errors stay populated as advisory) — the backend becomes the source of truth.
    if (Object.keys(errors).length > 0 && !currentOptions().submitInvalid) {
      patch({ isSubmitSuccessful: false }); // invalid + block-on-errors — onSubmit never runs
      return false;
    }
    const options = currentOptions();
    patch({ isSubmitting: true });
    let successful = false;
    try {
      await options.onSubmit(peek().values);
      successful = true;
    } catch (error) {
      const resolution = resolveSubmitFailure(
        error,
        options.mapSubmitError ?? fieldIssues,
        options.mapFieldPath ?? defaultMapFieldPath,
        (path) => hasPath(peek().values, path),
        options.fallbackErrorMessage,
        messageResolver(),
      );
      patch({ serverErrors: normalizeErrorMap(resolution.fieldErrors), submitError: resolution.submitError });
    } finally {
      patch({ isSubmitting: false, isSubmitSuccessful: successful });
    }
    return successful;
  }

  /**
   * Single-flight submit — while a run is in flight a re-entrant trigger (double-click / Enter-spam
   * / a `submitOn: 'change'` burst) coalesces onto it instead of starting a second `onSubmit`.
   */
  async function submit(): Promise<boolean> {
    if (inFlight) return inFlight;
    const run = performSubmit();
    inFlight = run;
    try {
      return await run;
    } finally {
      inFlight = null;
    }
  }

  /**
   * Validates without submitting — the validation half of `submit()`: marks every field touched
   * (so errors display and subsequent changes re-validate), runs the whole-form schema, and resolves
   * the client validity. `onSubmit` never runs; the server-error overlay is left untouched.
   */
  async function validate(): Promise<boolean> {
    if (peek().submitCount === 0) patch({ submitCount: 1 });
    const errors = await runValidation();
    return Object.keys(errors).length === 0;
  }

  // Validate on mount when flagged — seed `isValid` / field errors before any interaction WITHOUT
  // marking fields touched (submitCount stays 0), so an edit screen shows validity without asserting
  // the user has interacted. Runs after every action above is defined.
  if (currentOptions().validateOnMount) void runValidation();

  return {
    state: store,
    getFormState: () => {
      const internal = currentState();
      formState ??= buildFormState(internal);
      return formState;
    },
    getFieldState,
    setValue,
    blurField,
    applyArrayOperation,
    reset,
    setFieldErrors: setFieldErrorsAction,
    clearSubmitError,
    submit,
    validate,
    dispose: clearAutoSubmitTimer,
  };
}
