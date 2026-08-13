import { onScopeDispose, toValue } from 'vue';

import type { AppFieldApi, AppForm, AppFormOptionsSource } from '../AppForm';
import {
  createFieldApi,
  createFieldComponent,
  createFormStateView,
  createUseFormState,
} from '../FormGlue';

import { createHouseFormEngine, type HouseFormEngine } from './HouseFormCore';

/**
 * The house adapter's `useAppForm` — the facade contract over the zero-dependency
 * micro-store. The returned form object is stable for the owning scope's lifetime and every
 * state member on it is a live getter, so `form.values.title` / `form.state.isSubmitting` read
 * in a template ARE the subscription; `form.engine` exposes the native {@link HouseFormEngine}
 * (the 90/10 escape hatch — typed here, `unknown` on the shared contract).
 *
 * Pass a getter / ref when an option must stay live (see `AppFormOptionsSource`); a plain object
 * is read once, which is what `defaultValues` + a closure `onSubmit` want.
 *
 * Call it in `setup()`: the pending `submitOn: 'change'` timer is released on scope teardown,
 * which is the whole of React's unmount effect here.
 */
export function useAppForm<TValues extends object>(
  options: AppFormOptionsSource<TValues>,
): AppForm<TValues, HouseFormEngine<TValues>> {
  const engine = createHouseFormEngine<TValues>(() => toValue(options));
  onScopeDispose(engine.dispose, true);

  // One API object per path, so a slot payload keeps its identity across commits (React got this
  // from `useMemo` inside the per-field hook; here the map outlives every render).
  const fieldApis = new Map<string, AppFieldApi<unknown>>();
  const fieldOps = {
    getState: (path: string) => engine.getFieldState(path),
    setValue: (path: string, value: unknown) => engine.setValue(path, value),
    blur: (path: string) => engine.blurField(path),
  };
  const getFieldApi = (path: string): AppFieldApi<unknown> => {
    const existing = fieldApis.get(path);
    if (existing) return existing;
    const api = createFieldApi(path, fieldOps);
    fieldApis.set(path, api);
    return api;
  };

  const state = createFormStateView<TValues>(engine.getFormState);

  return {
    Field: createFieldComponent<TValues>(getFieldApi, () => toValue(options).isDisabled ?? false),
    state,
    // The same computed `state.values` reads — `form.values` is a shorthand, never a second source.
    get values() {
      return state.values;
    },
    useFormState: createUseFormState<TValues>(engine.getFormState),
    handleSubmit: (event?: Event) => {
      event?.preventDefault();
      return engine.submit();
    },
    validate: () => engine.validate(),
    setValue: (path, value) => engine.setValue(path, value),
    array: (path: string) => ({
      push: (value: unknown) => engine.applyArrayOperation(path, { kind: 'push', value }),
      insert: (index: number, value: unknown) => engine.applyArrayOperation(path, { kind: 'insert', index, value }),
      remove: (index: number) => engine.applyArrayOperation(path, { kind: 'remove', index }),
      swap: (indexA: number, indexB: number) => engine.applyArrayOperation(path, { kind: 'swap', indexA, indexB }),
      move: (fromIndex: number, toIndex: number) =>
        engine.applyArrayOperation(path, { kind: 'move', fromIndex, toIndex }),
    }),
    reset: (next?: TValues) => engine.reset(next),
    setFieldErrors: (errors: Record<string, string[]>) => engine.setFieldErrors(errors),
    clearSubmitError: () => engine.clearSubmitError(),
    engine,
  };
}
