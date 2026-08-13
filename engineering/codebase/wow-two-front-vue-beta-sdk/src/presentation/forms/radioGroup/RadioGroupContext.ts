/**
 * The group ↔ item channel for `RadioGroup`.
 *
 * React injected `name` / `checked` / `onChange` into each child with `Children.map` +
 * `cloneElement`. Vue cannot rewrite a slot child's props, so the group PROVIDES this
 * context and `RadioField` / `ChoiceCard` INJECT it — the item reads its own selected
 * state and reports selection back. The item's `value` prop is what keys it, exactly as
 * React's `ChildLike.value` did.
 *
 * `name` is the shared radio name that powers native arrow-key roving; `isDisabled` /
 * `isInvalid` cascade the group flags, and the item severs the surrounding `Field`'s id
 * and `describedBy` the way React's fresh per-item `FormControlProvider` did.
 */
import { inject, type InjectionKey } from 'vue';

export interface RadioGroupContextValue {
  /** The shared `name` every item's radio carries. */
  readonly name: () => string;
  /** Whether `value` is the current selection. */
  readonly isSelected: (value: string | undefined) => boolean;
  /** Makes `value` the selection. */
  readonly select: (value: string | undefined) => void;
  /** The group-level disabled flag, cascaded to every item. */
  readonly isDisabled: () => boolean | undefined;
  /** The group-level invalid flag, cascaded to every item. */
  readonly isInvalid: () => boolean;
}

export const RadioGroupKey: InjectionKey<RadioGroupContextValue> = Symbol('wow-two.radioGroup');

/** Reads the surrounding `RadioGroup`, or `null` when the item stands alone. */
export function useRadioGroup(): RadioGroupContextValue | null {
  return inject(RadioGroupKey, null);
}
