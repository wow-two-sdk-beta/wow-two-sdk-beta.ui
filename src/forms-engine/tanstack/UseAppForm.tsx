import { useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';

import {
  revalidateLogic,
  useForm,
  type DeepKeys,
  type FormAsyncValidateOrFn,
  type FormOptions,
  type FormValidateAsyncFn,
  type ReactFormExtendedApi,
} from '@tanstack/react-form';

import { fieldErrors } from '../../foundation/http';

import type { AppFieldApi, AppForm, AppFormOptions, AppFormState } from '../AppForm';
import { deepEqual } from '../DeepEqual';
import { createFieldComponent, createSubscribeComponent } from '../FormGlue';
import { getPath, hasPath } from '../Paths';
import { runStandardSchema } from '../SchemaValidation';
import { defaultMapFieldPath, resolveSubmitFailure } from '../SubmitErrors';

import {
  createTanstackFormOverlay,
  type TanstackFormOverlay,
  type TanstackOverlayState,
} from './TanstackFormOverlay';

/*
 * The tanstack adapter — the facade contract over `@tanstack/react-form` (optional peer).
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
 *     per run (latest-ref), so swapping schema instances between renders is honored.
 *   - Escape-hatch writes (`engine.setFieldValue`) bypass the overlay — server-error
 *     clearing and touched semantics then follow TanStack, not the contract.
 */

/** The native TanStack form instance the adapter builds — what `form.engine` exposes. */
export type TanstackFormEngine<TValues extends object> = ReactFormExtendedApi<
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

/** The per-field slice the `Field` glue subscribes to — identity-stable while its members are unchanged. */
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

interface CombinedReader<TValues extends object> {
  readonly getFormState: () => AppFormState<TValues>;
  readonly getFieldState: (path: string) => TanstackFieldState;
}

/**
 * Derives the contract state from the (TanStack store state, overlay state) pair with
 * generation caching: snapshots are rebuilt only when either source commits, and per-path
 * field slices reuse the previous generation's identity when unchanged — so
 * `useSyncExternalStore` reads stay referentially stable between notifications.
 */
function createCombinedReader<TValues extends object>(
  engine: TanstackFormEngine<TValues>,
  overlay: TanstackFormOverlay<TValues>,
): CombinedReader<TValues> {
  let generation: { tan: EngineStateView; ov: TanstackOverlayState<TValues> } | null = null;
  let formState: AppFormState<TValues> | null = null;
  let fieldCache = new Map<string, TanstackFieldState>();
  let previousFieldCache = new Map<string, TanstackFieldState>();

  function currentGeneration(): { tan: EngineStateView; ov: TanstackOverlayState<TValues> } {
    const tan = engine.store.state as unknown as EngineStateView;
    const ov = overlay.getState();
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

/**
 * Subscribes to a selected slice of the combined form state — re-renders only when the
 * selected value changes (`Object.is`), never form-wide (house-identical with-selector).
 */
function useCombinedSlice<TValues extends object, TSlice>(
  subscribe: (listener: () => void) => () => void,
  reader: CombinedReader<TValues>,
  selector: (state: AppFormState<TValues>) => TSlice,
  isEqual?: (a: TSlice, b: TSlice) => boolean,
): TSlice {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;
  const cacheRef = useRef<{
    state: AppFormState<TValues>;
    selector: (state: AppFormState<TValues>) => TSlice;
    slice: TSlice;
  } | null>(null);

  const read = (): TSlice => {
    const state = reader.getFormState();
    const currentSelector = selectorRef.current;
    const cached = cacheRef.current;
    if (cached && cached.state === state && cached.selector === currentSelector) return cached.slice;
    const slice = currentSelector(state);
    // `isEqual` (default `Object.is`) keeps a fresh-but-equal composite selection on the
    // cached ref, so `useSyncExternalStore` bails the re-render instead of churning on it.
    const equals = isEqualRef.current ?? Object.is;
    if (cached && equals(cached.slice, slice)) {
      cacheRef.current = { state, selector: currentSelector, slice: cached.slice };
      return cached.slice;
    }
    cacheRef.current = { state, selector: currentSelector, slice };
    return slice;
  };

  return useSyncExternalStore(subscribe, read, read);
}

/** Subscribes to one field's combined slice (identity-stable in the reader) and binds its actions. */
function useCombinedField<TValues extends object>(
  subscribe: (listener: () => void) => () => void,
  reader: CombinedReader<TValues>,
  engine: TanstackFormEngine<TValues>,
  overlay: TanstackFormOverlay<TValues>,
  path: string,
): AppFieldApi<unknown> {
  const read = () => reader.getFieldState(path);
  const fieldState = useSyncExternalStore(subscribe, read, read);
  return useMemo<AppFieldApi<unknown>>(
    () => ({
      value: fieldState.value,
      errors: fieldState.errors,
      isDirty: fieldState.isDirty,
      isTouched: fieldState.isTouched,
      setValue: (value: unknown) => {
        // Server messages clear on the next change to the field (contract JSDoc).
        overlay.clearServerErrorsAt(path);
        // Triggers TanStack 'change'-cause validation, gated by `revalidateLogic`.
        engine.setFieldValue(path as DeepKeys<TValues>, value as never);
      },
      onBlur: () => {
        overlay.markBlurred(path);
        // 'blur'-cause validation — runs the schema only in `validateOn: 'blur'` mode.
        void engine.validateField(path as DeepKeys<TValues>, 'blur');
      },
    }),
    [engine, overlay, path, fieldState],
  );
}

interface AdapterPrelude<TValues extends object> {
  readonly getOptions: () => AppFormOptions<TValues>;
  readonly overlay: TanstackFormOverlay<TValues>;
  readonly tanstackOptions: TanstackFormOptions<TValues>;
}

/** Builds the overlay + the stable TanStack options (all callbacks latest-ref through `getOptions`). */
function createAdapterPrelude<TValues extends object>(
  getOptions: () => AppFormOptions<TValues>,
): AdapterPrelude<TValues> {
  const initialOptions = getOptions();
  const overlay = createTanstackFormOverlay<TValues>(initialOptions.defaultValues);

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
      return toEngineValidationError(await runStandardSchema(schema, value));
    };
    tanstackOptions.validators = { onDynamicAsync: validateWithSchema };
    tanstackOptions.validationLogic = revalidateLogic({
      // `validateOn` maps 1:1 onto the pre-submission mode; after the first attempt
      // every mode re-validates on change so errors clear as the user fixes them.
      mode: initialOptions.validateOn ?? 'submit',
      modeAfterSubmission: 'change',
    });
  }

  return { getOptions, overlay, tanstackOptions };
}

/** Builds the referentially-stable contract surface over the TanStack engine + overlay pair. */
function buildAppForm<TValues extends object>(
  engine: TanstackFormEngine<TValues>,
  prelude: AdapterPrelude<TValues>,
): AppForm<TValues, TanstackFormEngine<TValues>> {
  const { getOptions, overlay, tanstackOptions } = prelude;
  const reader = createCombinedReader(engine, overlay);

  const subscribe = (listener: () => void): (() => void) => {
    const engineSubscription = engine.store.subscribe(listener);
    const unsubscribeOverlay = overlay.subscribe(listener);
    return () => {
      engineSubscription.unsubscribe();
      unsubscribeOverlay();
    };
  };

  const useFormState = <TSlice,>(
    selector: (state: AppFormState<TValues>) => TSlice,
    isEqual?: (a: TSlice, b: TSlice) => boolean,
  ): TSlice => useCombinedSlice(subscribe, reader, selector, isEqual);
  const useFieldApi = (path: string): AppFieldApi<unknown> =>
    useCombinedField(subscribe, reader, engine, overlay, path);

  const arrayOperation = (path: string, operation: Parameters<typeof overlay.remapForArrayOperation>[1]): void => {
    const field = path as DeepKeys<TValues>;
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
  };

  return {
    Field: createFieldComponent<TValues>(useFieldApi),
    Subscribe: createSubscribeComponent<TValues>(useFormState),
    useFormState,
    handleSubmit: async (event?: FormEvent) => {
      event?.preventDefault();
      // Before validation: a new attempt clears the previous server errors/submitError,
      // re-arms the verdict, and marks everything touched — even when validation then fails.
      overlay.beginSubmitAttempt();
      let succeeded = false;
      try {
        await engine.handleSubmit();
        // The wrapper `onSubmit` flips the verdict true only on a valid + resolved submit;
        // an invalid attempt leaves it `null` (no throw, `onSubmit` never ran).
        succeeded = overlay.getState().isSubmitSuccessful === true;
      } catch (error) {
        // TanStack rethrows `onSubmit` failures — resolve them here so the contract's
        // `handleSubmit` never rejects and no server message silently disappears.
        const options = getOptions();
        const values = engine.store.state.values;
        overlay.applySubmitFailure(
          resolveSubmitFailure(
            error,
            options.mapSubmitError ?? fieldErrors,
            options.mapFieldPath ?? defaultMapFieldPath,
            (path) => hasPath(values, path),
            options.fallbackErrorMessage,
          ),
        );
        succeeded = false;
      }
      // Settle the verdict — the invalid path's `null` becomes `false`; success is idempotent.
      overlay.setSubmitSuccessful(succeeded);
      return succeeded;
    },
    setValue: (path, value) => {
      // Server messages clear on the next change to the field (contract JSDoc) — mirror the
      // in-field `setValue`; TanStack's 'change'-cause validation runs under `revalidateLogic`.
      overlay.clearServerErrorsAt(path);
      engine.setFieldValue(path as DeepKeys<TValues>, value as never);
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
      // Keep the stable options object in sync: TanStack's `reset(values)` rewrites its
      // own `options.defaultValues`, and `useForm`'s per-render `update()` would clobber
      // the re-seeded values back if the two copies diverged.
      tanstackOptions.defaultValues = values;
      overlay.reset(values);
      engine.reset(values);
    },
    setFieldErrors: (errors: Record<string, string[]>) => overlay.replaceServerErrors(errors),
    clearSubmitError: () => overlay.clearSubmitError(),
    engine,
  };
}

/**
 * The tanstack adapter's `useAppForm` — the facade contract over `@tanstack/react-form`.
 * The returned form object is referentially stable for the component's lifetime;
 * `form.engine` exposes the native {@link TanstackFormEngine} (the 90/10 escape hatch —
 * typed here, `unknown` on the shared contract), including TanStack's typed deep-path
 * `Field`/`Subscribe` and per-field validator graph.
 */
export function useAppForm<TValues extends object>(
  options: AppFormOptions<TValues>,
): AppForm<TValues, TanstackFormEngine<TValues>> {
  const optionsRef = useRef(options);
  optionsRef.current = options; // latest-ref: submit/validation always read the current render's callbacks

  const [prelude] = useState(() => createAdapterPrelude<TValues>(() => optionsRef.current));
  // The options object is referentially stable, so TanStack's per-render `update()` is a no-op.
  const engine = useForm(prelude.tanstackOptions);
  const [form] = useState(() => buildAppForm<TValues>(engine, prelude));

  return form;
}
