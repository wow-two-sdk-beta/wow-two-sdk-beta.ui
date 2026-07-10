import type { ReactNode } from 'react';

import { FormControlProvider } from '../foundation/primitives';

import type {
  AppFieldApi,
  AppFieldComponent,
  AppFieldProps,
  AppFieldValue,
  AppFormState,
  AppSubscribeComponent,
  AppSubscribeProps,
} from './AppForm';

/*
 * Engine-free `Field` / `Subscribe` glue — adapters feed their reactive hooks in,
 * apps get identical components back regardless of engine. `Field` always mounts a
 * `FormControlProvider` (foundation) with `isInvalid`, the merged `errors`, and the
 * per-mode flags, so every SDK control that reads `useFormControl()` auto-wires aria
 * unmodified — and the presentation `Field` / `FormErrorMessage` composed inside the
 * render prop ADOPT this provider (no second provider, no `error={f.errors[0]}`
 * hand-wiring): label/helper/error chrome renders straight from the context.
 * Boundaries: this module never imports presentation — the chrome side of the seam
 * is the foundation `FormControlContext` alone.
 */

/** Builds the `form.Field` component from an adapter's per-field subscription hook. */
export function createFieldComponent<TValues extends object>(
  useFieldApi: (path: string) => AppFieldApi<unknown>,
): AppFieldComponent<TValues> {
  function AppField<TPath extends string>(props: AppFieldProps<TValues, TPath>): ReactNode {
    const field = useFieldApi(props.name);
    return (
      <FormControlProvider
        isInvalid={field.errors.length > 0}
        errors={field.errors}
        isDisabled={props.isDisabled}
        isRequired={props.isRequired}
        isReadOnly={props.isReadOnly}
      >
        {props.children(field as AppFieldApi<AppFieldValue<TValues, TPath>>)}
      </FormControlProvider>
    );
  }
  return AppField;
}

/** Builds the `form.Subscribe` component from an adapter's selector-subscribed state hook. */
export function createSubscribeComponent<TValues extends object>(
  useFormState: <TSlice>(selector: (state: AppFormState<TValues>) => TSlice) => TSlice,
): AppSubscribeComponent<TValues> {
  function AppSubscribe<TSlice>(props: AppSubscribeProps<TValues, TSlice>): ReactNode {
    const slice = useFormState(props.selector);
    return props.children(slice);
  }
  return AppSubscribe;
}
