import { createContext, useContext, type ReactNode } from 'react';
import { useId } from '../../hooks/useId';

export interface FormControlContextValue {
  id: string;
  labelId: string;
  helperId: string;
  errorId: string;
  isInvalid: boolean;
  isDisabled: boolean;
  isRequired: boolean;
  isReadOnly: boolean;
}

const Context = createContext<FormControlContextValue | null>(null);

export interface FormControlProviderProps {
  /** Override the auto-generated id (also used as control's `id`). */
  id?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  children: ReactNode;
}

/**
 * Wires Label ↔ control ↔ HelperText/ErrorMessage via stable IDs and shared
 * state flags. Used by `FormField` (L4) — atoms (Input, Label, etc.) read
 * via `useFormControl()` to get the right `id`/`htmlFor`/`aria-describedby`.
 */
export function FormControlProvider({
  id: providedId,
  isInvalid = false,
  isDisabled = false,
  isRequired = false,
  isReadOnly = false,
  children,
}: FormControlProviderProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const value: FormControlContextValue = {
    id,
    labelId: `${id}-label`,
    helperId: `${id}-helper`,
    errorId: `${id}-error`,
    isInvalid,
    isDisabled,
    isRequired,
    isReadOnly,
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/**
 * Read the surrounding form-control context. Returns `null` when used
 * outside a provider — atoms gracefully degrade to standalone mode.
 */
export function useFormControl(): FormControlContextValue | null {
  return useContext(Context);
}
