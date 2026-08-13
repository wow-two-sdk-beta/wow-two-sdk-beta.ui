import { inject, type InjectionKey, type ShallowRef } from 'vue';

/** Represents one registered option in the combobox list. */
export interface ComboboxItemEntry {
  id: string;
  value: string;
  isDisabled: boolean;
  /**
   * The plain-text label.
   *
   * React registered the item's `children` (a `ReactNode`) and narrowed it with a
   * `typeof === 'string'` check before filling the input. A slot cannot be captured into a
   * registry, so this is `string | number` — the same call `SelectOption.label` makes. Rich
   * rows stay available through `<ComboboxItem>`'s default slot.
   */
  label: string | number;
}

/**
 * The seam between `Combobox` and its `Input` / `Content` / `Item` children.
 *
 * React attached those as `Combobox.Input` / `.Content` / … statics over a `createContext`.
 * An SFC's generated default export cannot carry statics cleanly, so they ship as sibling
 * components and share state through provide/inject instead.
 *
 * Every field but the functions and the element refs is a live getter — read them off the
 * object, don't destructure.
 */
export interface ComboboxContextValue {
  readonly open: boolean;
  setOpen: (open: boolean) => void;
  readonly value: string;
  setValue: (value: string) => void;
  readonly inputValue: string;
  setInputValue: (input: string) => void;
  readonly activeId: string | null;
  setActiveId: (id: string | null) => void;
  registerItem: (entry: ComboboxItemEntry) => void;
  unregisterItem: (id: string) => void;
  /** The registered options in mount order. Reactive, unlike React's `useRef` array. */
  readonly items: ReadonlyArray<ComboboxItemEntry>;
  /** Holds the DOM node of the text input — the panel anchors and sizes off it. */
  inputEl: ShallowRef<HTMLInputElement | null>;
  /** Holds the DOM node of the panel — the input's blur check tests containment against it. */
  contentEl: ShallowRef<HTMLElement | null>;
  readonly listboxId: string;
  readonly isDisabled: boolean;
  readonly isInvalid?: boolean;
  selectItem: (entry: ComboboxItemEntry, options?: { close?: boolean }) => void;
}

export const comboboxContextKey: InjectionKey<ComboboxContextValue> = Symbol('wow-two.combobox');

/** Reads the surrounding combobox context; throws when used outside a `<Combobox>`. */
export function useComboboxContext(): ComboboxContextValue {
  const ctx = inject(comboboxContextKey, null);
  if (!ctx) throw new Error('Combobox.* must be used inside <Combobox>');
  return ctx;
}
