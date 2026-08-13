import { inject, type InjectionKey } from 'vue';

/**
 * The seam between `MultiSelect` and its `Trigger` / `Tags` / `Content` / `Item` children.
 *
 * React attached those as `MultiSelect.Trigger` / `.Tags` / … statics over a `createContext`.
 * An SFC's generated default export cannot carry statics cleanly, so they ship as sibling
 * components and share state through provide/inject instead.
 *
 * Every field but the setters is a live getter — read them off the object, don't destructure.
 */
export interface MultiSelectContextValue {
  readonly open: boolean;
  setOpen: (open: boolean) => void;
  readonly values: ReadonlyArray<string>;
  setValues: (values: ReadonlyArray<string>) => void;

  /**
   * The chip text per selected value.
   *
   * React registered each item's `children` (a `ReactNode`) here. It is `string | number`
   * in this port for the same reason `SelectOption.label` is: a slot cannot be captured into
   * a plain registry, and the tag also feeds the remove button's accessible name. Rich rows
   * stay available through `<MultiSelectItem>`'s default slot.
   */
  readonly labels: Record<string, string | number>;
  registerLabel: (value: string, label: string | number) => void;
  unregisterLabel: (value: string) => void;

  readonly isDisabled: boolean;
  readonly name?: string;
  readonly isInvalid?: boolean;

  /** Form-control wiring inherited from a surrounding `<Field>` (undefined when standalone).
   *  `labelId`/`describedBy` carry only ids of chrome that is actually rendered. */
  readonly fieldId?: string;
  readonly labelId?: string;
  readonly describedBy?: string;
}

export const multiSelectContextKey: InjectionKey<MultiSelectContextValue> =
  Symbol('wow-two.multiSelect');

/** Reads the surrounding multi-select context; throws when used outside a `<MultiSelect>`. */
export function useMultiSelectContext(): MultiSelectContextValue {
  const ctx = inject(multiSelectContextKey, null);
  if (!ctx) throw new Error('MultiSelect.* must be used inside <MultiSelect>');
  return ctx;
}
