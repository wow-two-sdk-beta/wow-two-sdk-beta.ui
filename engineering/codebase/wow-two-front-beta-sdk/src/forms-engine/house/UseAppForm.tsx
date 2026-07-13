import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';

import type { AppFieldApi, AppForm, AppFormOptions, AppFormState } from '../AppForm';
import { createFieldComponent, createSubscribeComponent } from '../FormGlue';

import { createHouseFormEngine, type HouseFormEngine } from './HouseFormCore';

/**
 * Subscribes to a selected slice of the form state — re-renders only when the
 * selected value changes (`Object.is`), never form-wide. Hand-rolled
 * `useSyncExternalStore` with-selector (no extra dependency): the selection is
 * cached per (state identity, selector identity) so `getSnapshot` stays stable
 * between store notifications.
 */
function useEngineSlice<TValues extends object, TSlice>(
  engine: HouseFormEngine<TValues>,
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
    const state = engine.getFormState();
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

  return useSyncExternalStore(engine.subscribe, read, read);
}

/** Subscribes to one field's slice (identity-stable in the store) and binds its actions. */
function useEngineField<TValues extends object>(
  engine: HouseFormEngine<TValues>,
  path: string,
): AppFieldApi<unknown> {
  const read = () => engine.getFieldState(path);
  const fieldState = useSyncExternalStore(engine.subscribe, read, read);
  return useMemo<AppFieldApi<unknown>>(
    () => ({
      value: fieldState.value,
      errors: fieldState.errors,
      isDirty: fieldState.isDirty,
      isTouched: fieldState.isTouched,
      setValue: (value: unknown) => engine.setValue(path, value),
      onBlur: () => engine.blurField(path),
    }),
    [engine, path, fieldState],
  );
}

/**
 * The house adapter's `useAppForm` — the facade contract over the zero-dependency
 * micro-store. The returned form object is referentially stable for the component's
 * lifetime; `form.engine` exposes the native {@link HouseFormEngine} (the 90/10
 * escape hatch — typed here, `unknown` on the shared contract).
 */
export function useAppForm<TValues extends object>(
  options: AppFormOptions<TValues>,
): AppForm<TValues, HouseFormEngine<TValues>> {
  const optionsRef = useRef(options);
  optionsRef.current = options; // latest-ref: submit/validation always read the current render's callbacks

  const [form] = useState<AppForm<TValues, HouseFormEngine<TValues>>>(() => {
    const engine = createHouseFormEngine<TValues>(() => optionsRef.current);

    const useFormState = <TSlice,>(
      selector: (state: AppFormState<TValues>) => TSlice,
      isEqual?: (a: TSlice, b: TSlice) => boolean,
    ): TSlice => useEngineSlice(engine, selector, isEqual);
    const useFieldApi = (path: string): AppFieldApi<unknown> => useEngineField(engine, path);

    return {
      Field: createFieldComponent<TValues>(useFieldApi, () => optionsRef.current.isDisabled ?? false),
      Subscribe: createSubscribeComponent<TValues>(useFormState),
      useFormState,
      handleSubmit: (event?: FormEvent) => {
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
        move: (fromIndex: number, toIndex: number) => engine.applyArrayOperation(path, { kind: 'move', fromIndex, toIndex }),
      }),
      reset: (next?: TValues) => engine.reset(next),
      setFieldErrors: (errors: Record<string, string[]>) => engine.setFieldErrors(errors),
      clearSubmitError: () => engine.clearSubmitError(),
      engine,
    };
  });

  // Release the pending `submitOn: 'change'` debounce timer when the form unmounts.
  useEffect(() => () => form.engine.dispose(), [form]);

  return form;
}
