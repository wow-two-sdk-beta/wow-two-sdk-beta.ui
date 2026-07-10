import { fieldErrors, type ApiError } from '../../foundation/http';

import type { AppFormOptions, AppFormState } from '../AppForm';
import { deepEqual } from '../DeepEqual';
import {
  getPath,
  hasPath,
  mutateRows,
  remapPathMap,
  remapPathSet,
  setPath,
  type ArrayOperation,
} from '../Paths';
import { runStandardSchema } from '../SchemaValidation';
import { defaultMapFieldPath, resolveSubmitFailure } from '../SubmitErrors';

/*
 * The house micro-store — a plain external store `useSyncExternalStore` subscribes to.
 * SCOPE CEILING (docs/analysis/forms-engine.md §7): flat + dot-path store, whole-schema
 * Standard Schema validation, arrays, dirty/touched, submit pipeline. NO typed deep
 * paths, NO per-field async/debounce validators, NO linked-field graphs — a form that
 * needs those uses the tanstack adapter (phase 2). Grow this file only from product
 * evidence; everything else is the `form.engine` escape hatch.
 */

type ErrorMap = Readonly<Record<string, readonly string[]>>;

const EMPTY_ERRORS: readonly string[] = Object.freeze([]);
const EMPTY_MAP: ErrorMap = Object.freeze({});

/** The per-field slice the `Field` glue subscribes to — identity-stable while its members are unchanged. */
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
}

/** The native house form instance — what `form.engine` exposes on the house adapter. */
export interface HouseFormEngine<TValues extends object> {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getFormState: () => AppFormState<TValues>;
  readonly getFieldState: (path: string) => HouseFieldState;
  readonly setValue: (path: string, value: unknown) => void;
  readonly blurField: (path: string) => void;
  readonly applyArrayOperation: (path: string, operation: ArrayOperation) => void;
  readonly reset: (next?: TValues) => void;
  readonly setFieldErrors: (errors: Record<string, string[]>) => void;
  readonly submit: () => Promise<void>;
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

/** Creates the house form store. `getOptions` reads the latest render's options (query-style latest-ref). */
export function createHouseFormEngine<TValues extends object>(
  getOptions: () => AppFormOptions<TValues>,
): HouseFormEngine<TValues> {
  const initialValues = getOptions().defaultValues;

  let state: InternalState<TValues> = {
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
  };

  let formState: AppFormState<TValues> = buildFormState(state);
  const listeners = new Set<() => void>();
  /** Per-path field slices for the CURRENT state — rebuilt lazily, reusing the previous generation's identity when unchanged. */
  let fieldCache = new Map<string, HouseFieldState>();
  let previousFieldCache = new Map<string, HouseFieldState>();
  /** Monotonic guard: only the newest validation run may apply its result (async schemas). */
  let validationEpoch = 0;

  function buildFormState(internal: InternalState<TValues>): AppFormState<TValues> {
    return {
      values: internal.values,
      isDirty: !deepEqual(internal.values, internal.baseline),
      isValid: Object.keys(internal.errors).length === 0,
      isSubmitting: internal.isSubmitting,
      isValidating: internal.isValidating,
      submitError: internal.submitError,
    };
  }

  function commit(next: InternalState<TValues>): void {
    state = next;
    formState = buildFormState(next);
    previousFieldCache = fieldCache;
    fieldCache = new Map();
    for (const listener of [...listeners]) listener();
  }

  function patch(partial: Partial<InternalState<TValues>>): void {
    const next = { ...state, ...partial };
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
    return validateOn === 'change' || state.submitCount > 0;
  }

  /** Runs whole-schema validation; sync schemas apply synchronously, async ones flip `isValidating`. */
  function runValidation(): Record<string, string[]> | Promise<Record<string, string[]>> {
    const epoch = ++validationEpoch;
    const schema = currentOptions().schema;
    if (!schema) {
      if (Object.keys(state.clientErrors).length > 0 || state.isValidating) {
        patch({ clientErrors: EMPTY_MAP, isValidating: false });
      }
      return {};
    }
    const outcome = runStandardSchema(schema, state.values);
    if (outcome instanceof Promise) {
      if (!state.isValidating) patch({ isValidating: true });
      return outcome.then((errors) => {
        if (epoch === validationEpoch) patch({ clientErrors: normalizeErrorMap(errors), isValidating: false });
        return errors;
      });
    }
    patch({ clientErrors: normalizeErrorMap(outcome), isValidating: false });
    return outcome;
  }

  function getFieldState(path: string): HouseFieldState {
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
    // Server messages clear on the next change to the field (contract JSDoc).
    const serverErrors = Object.prototype.hasOwnProperty.call(state.serverErrors, path)
      ? Object.fromEntries(Object.entries(state.serverErrors).filter(([key]) => key !== path))
      : state.serverErrors;
    patch({ values: setPath(state.values, path, value), serverErrors });
    if (shouldValidateOnChange()) void runValidation();
  }

  function blurField(path: string): void {
    if (!state.touched.has(path)) {
      const touched = new Set(state.touched);
      touched.add(path);
      patch({ touched });
    }
    if ((currentOptions().validateOn ?? 'submit') === 'blur') void runValidation();
  }

  function applyArrayOperation(path: string, operation: ArrayOperation): void {
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
  }

  function reset(next?: TValues): void {
    validationEpoch += 1; // drop any in-flight validation result
    const values = next ?? currentOptions().defaultValues;
    commit({
      values,
      baseline: values,
      clientErrors: EMPTY_MAP,
      serverErrors: EMPTY_MAP,
      errors: EMPTY_MAP,
      touched: new Set<string>(),
      submitCount: 0,
      isSubmitting: state.isSubmitting, // an in-flight submit still owns its flag (its finally clears it)
      isValidating: false,
      submitError: null,
    });
  }

  function setFieldErrorsAction(errors: Record<string, string[]>): void {
    patch({ serverErrors: normalizeErrorMap(errors) });
  }

  async function submit(): Promise<void> {
    patch({ submitCount: state.submitCount + 1, serverErrors: EMPTY_MAP, submitError: null });
    const errors = await runValidation();
    if (Object.keys(errors).length > 0) return; // invalid — onSubmit never runs
    const options = currentOptions();
    patch({ isSubmitting: true });
    try {
      await options.onSubmit(state.values);
    } catch (error) {
      const resolution = resolveSubmitFailure(
        error,
        options.mapSubmitError ?? fieldErrors,
        options.mapFieldPath ?? defaultMapFieldPath,
        (path) => hasPath(state.values, path),
      );
      patch({ serverErrors: normalizeErrorMap(resolution.fieldErrors), submitError: resolution.submitError });
    } finally {
      patch({ isSubmitting: false });
    }
  }

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getFormState: () => formState,
    getFieldState,
    setValue,
    blurField,
    applyArrayOperation,
    reset,
    setFieldErrors: setFieldErrorsAction,
    submit,
  };
}
