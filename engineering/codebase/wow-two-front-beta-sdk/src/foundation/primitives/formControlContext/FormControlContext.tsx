import { createContext, useCallback, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { useId } from '../../hooks/useId';

/** The chrome slots a form control can be described/named by. */
export type FormControlChromeKind = 'label' | 'helper' | 'error';

export interface FormControlContextValue {
  id: string;
  labelId: string;
  helperId: string;
  errorId: string;
  /**
   * The `aria-labelledby` target — `labelId` only while a Label chrome is actually
   * mounted, else `undefined`. Widgets that can't be named via `htmlFor` (button
   * triggers, ARIA sliders) reference THIS, never `labelId` directly — referencing
   * a non-rendered id is an axe `aria-valid-attr-value` violation.
   */
  labelledBy?: string;
  /**
   * The `aria-describedby` target — only the ids of helper/error chrome actually
   * mounted (space-joined), else `undefined`. Controls wire this verbatim; never
   * hand-compose `helperId`/`errorId` (dangling ids when the chrome isn't rendered).
   */
  describedBy?: string;
  /**
   * The field's error messages (client + server merged, client first) — fed by the
   * forms-engine `Field` glue so error chrome (`FormErrorMessage`) renders them
   * without hand-wiring. `undefined` outside an engine-driven field.
   */
  errors?: readonly string[];
  isInvalid: boolean;
  isDisabled: boolean;
  isRequired: boolean;
  isReadOnly: boolean;
  /** Registers a mounted chrome node (label/helper/error); returns the unregister. Chrome uses {@link useFormControlChrome}. */
  registerChrome: (kind: FormControlChromeKind) => () => void;
}

const Context = createContext<FormControlContextValue | null>(null);

export interface FormControlProviderProps {
  /** The id override for the auto-generated id (also used as control's `id`). */
  id?: string;
  /** The field's error messages — exposed to chrome via context (see {@link FormControlContextValue.errors}). */
  errors?: readonly string[];
  isInvalid?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  children: ReactNode;
}

type ChromeCounts = Record<FormControlChromeKind, number>;

const NO_CHROME: ChromeCounts = { label: 0, helper: 0, error: 0 };

/**
 * Wires Label ↔ control ↔ HelperText/ErrorMessage via stable IDs and shared
 * state flags. Used by `Field` (L4) and the forms-engine `Field` glue — atoms
 * (Input, Label, etc.) read via `useFormControl()` to get the right
 * `id`/`htmlFor`/`aria-describedby`. Chrome nodes self-register on mount, so
 * `labelledBy`/`describedBy` only ever reference ids that exist in the DOM.
 */
export function FormControlProvider({
  id: providedId,
  errors,
  isInvalid = false,
  isDisabled = false,
  isRequired = false,
  isReadOnly = false,
  children,
}: FormControlProviderProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const [chrome, setChrome] = useState<ChromeCounts>(NO_CHROME);
  const registerChrome = useCallback((kind: FormControlChromeKind) => {
    setChrome((counts) => ({ ...counts, [kind]: counts[kind] + 1 }));
    return () => setChrome((counts) => ({ ...counts, [kind]: counts[kind] - 1 }));
  }, []);

  const labelId = `${id}-label`;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const describedBy =
    [chrome.helper > 0 && helperId, chrome.error > 0 && errorId].filter(Boolean).join(' ') ||
    undefined;
  const value: FormControlContextValue = {
    id,
    labelId,
    helperId,
    errorId,
    labelledBy: chrome.label > 0 ? labelId : undefined,
    describedBy,
    errors,
    isInvalid,
    isDisabled,
    isRequired,
    isReadOnly,
    registerChrome,
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

/**
 * Registers a chrome node (label/helper/error) with the surrounding form control
 * while `isRendered` — flips the context's `labelledBy`/`describedBy` to include
 * the node's id only for the frames it actually exists. Call unconditionally
 * (rules of hooks); pass `isRendered: false` when the chrome renders `null` or
 * renders under an explicit `id` prop instead of the context id.
 */
export function useFormControlChrome(kind: FormControlChromeKind, isRendered: boolean): void {
  const ctx = useFormControl();
  const register = isRendered ? ctx?.registerChrome : undefined;
  useLayoutEffect(() => register?.(kind), [register, kind]);
}
