import type { ApiError } from '../../foundation/http';

import { remapPathMap, remapPathSet, type ArrayOperation } from '../Paths';
import type { SubmitFailureResolution } from '../SubmitErrors';

/*
 * The adapter-owned overlay store — the contract state TanStack Form does not model
 * (docs/analysis/forms-engine.md §4/§5). TanStack has no client/server error merge, its
 * touched marks on change (contract: blur OR submit attempt), its dirty is sticky
 * per-field (contract: deep-compared against a resettable baseline), and its array
 * reindexing of field meta differs from the contract's remap rules. All four live here,
 * outside TanStack state, exactly like the house engine keeps them:
 *   - `serverErrors` — the server-error overlay, cleared per-path on the next change,
 *     replaced wholesale by `setFieldErrors`, remapped through array ops.
 *   - `baseline` — the dirty baseline `reset(next)` re-seeds.
 *   - `touched` — blur marks; `submitCount > 0` touches everything.
 *   - `isSubmitting` / `submitError` — the contract submit pipeline flags: `isSubmitting`
 *     wraps only the app's `onSubmit` call (not TanStack's validation window), and
 *     `submitError` holds the failure remainder no field could represent.
 */

type ErrorMap = Readonly<Record<string, readonly string[]>>;

const EMPTY_MAP: ErrorMap = Object.freeze({});

/** The adapter-owned slice merged with TanStack state into the contract's form/field state. */
export interface TanstackOverlayState<TValues extends object> {
  /** The dirty baseline — `reset(next)` re-seeds it. */
  readonly baseline: TValues;
  /** The server-error overlay, keyed by form path (`rules[0].destination`). */
  readonly serverErrors: ErrorMap;
  readonly touched: ReadonlySet<string>;
  readonly submitCount: number;
  readonly isSubmitting: boolean;
  readonly submitError: ApiError | null;
  /** The last completed submit's verdict — `null` until the first attempt completes and after `reset()`. */
  readonly isSubmitSuccessful: boolean | null;
}

/** The overlay store the tanstack adapter combines with the TanStack form store. */
export interface TanstackFormOverlay<TValues extends object> {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getState: () => TanstackOverlayState<TValues>;
  /** Marks a field touched (wired onto the control's blur). */
  readonly markBlurred: (path: string) => void;
  /** Server messages clear on the next change to the field (contract JSDoc). */
  readonly clearServerErrorsAt: (path: string) => void;
  /** Row-scoped server errors + touched marks follow their rows through array ops. */
  readonly remapForArrayOperation: (arrayPath: string, operation: ArrayOperation) => void;
  /** A new attempt clears the previous server errors + submitError, re-arms the verdict, and counts as touching everything. */
  readonly beginSubmitAttempt: () => void;
  /** Brackets the app's `onSubmit` call — the contract's `isSubmitting` window. */
  readonly setSubmitting: (isSubmitting: boolean) => void;
  /** Settles the last completed submit's verdict (`handleSubmit` mirrors it into `isSubmitSuccessful`). */
  readonly setSubmitSuccessful: (value: boolean | null) => void;
  /** Lands a resolved submit failure: matches as the server overlay, remainder as `submitError`. */
  readonly applySubmitFailure: (resolution: SubmitFailureResolution) => void;
  /** Replaces the server-error overlay (`setFieldErrors`). */
  readonly replaceServerErrors: (errors: Record<string, string[]>) => void;
  /** Clears the form-level `submitError` without touching field errors (`clearSubmitError`). */
  readonly clearSubmitError: () => void;
  /** Clears everything and re-seeds the dirty baseline. */
  readonly reset: (baseline: TValues) => void;
}

function normalizeErrorMap(errors: Record<string, string[]>): ErrorMap {
  const normalized: Record<string, readonly string[]> = {};
  for (const [path, messages] of Object.entries(errors)) normalized[path] = [...messages];
  return normalized;
}

/** Creates the adapter-owned overlay store seeded with the initial dirty baseline. */
export function createTanstackFormOverlay<TValues extends object>(
  initialBaseline: TValues,
): TanstackFormOverlay<TValues> {
  let state: TanstackOverlayState<TValues> = {
    baseline: initialBaseline,
    serverErrors: EMPTY_MAP,
    touched: new Set<string>(),
    submitCount: 0,
    isSubmitting: false,
    submitError: null,
    isSubmitSuccessful: null,
  };
  const listeners = new Set<() => void>();

  function commit(next: TanstackOverlayState<TValues>): void {
    state = next;
    for (const listener of [...listeners]) listener();
  }

  function patch(partial: Partial<TanstackOverlayState<TValues>>): void {
    commit({ ...state, ...partial });
  }

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState: () => state,
    markBlurred: (path) => {
      if (state.touched.has(path)) return;
      const touched = new Set(state.touched);
      touched.add(path);
      patch({ touched });
    },
    clearServerErrorsAt: (path) => {
      if (!Object.prototype.hasOwnProperty.call(state.serverErrors, path)) return;
      patch({
        serverErrors: Object.fromEntries(
          Object.entries(state.serverErrors).filter(([key]) => key !== path),
        ),
      });
    },
    remapForArrayOperation: (arrayPath, operation) => {
      patch({
        serverErrors: remapPathMap(state.serverErrors, arrayPath, operation),
        touched: remapPathSet(state.touched, arrayPath, operation),
      });
    },
    beginSubmitAttempt: () => {
      patch({ submitCount: state.submitCount + 1, serverErrors: EMPTY_MAP, submitError: null, isSubmitSuccessful: null });
    },
    setSubmitting: (isSubmitting) => {
      if (state.isSubmitting !== isSubmitting) patch({ isSubmitting });
    },
    setSubmitSuccessful: (value) => {
      if (state.isSubmitSuccessful !== value) patch({ isSubmitSuccessful: value });
    },
    applySubmitFailure: (resolution) => {
      patch({
        serverErrors: normalizeErrorMap(resolution.fieldErrors),
        submitError: resolution.submitError,
      });
    },
    replaceServerErrors: (errors) => {
      patch({ serverErrors: normalizeErrorMap(errors) });
    },
    clearSubmitError: () => {
      if (state.submitError !== null) patch({ submitError: null });
    },
    reset: (baseline) => {
      commit({
        baseline,
        serverErrors: EMPTY_MAP,
        touched: new Set<string>(),
        submitCount: 0,
        isSubmitting: state.isSubmitting, // an in-flight submit still owns its flag (its finally clears it)
        submitError: null,
        isSubmitSuccessful: null,
      });
    },
  };
}
