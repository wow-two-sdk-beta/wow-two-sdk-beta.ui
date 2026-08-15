import { computed, shallowRef, toValue, type MaybeRefOrGetter, type ShallowRef, type WritableComputedRef } from 'vue';

interface UseControlledOptions<T> {
  controlled: MaybeRefOrGetter<T | undefined>;
  default: MaybeRefOrGetter<T>;
  onChange?: (value: T) => void;
}

/** The controlled/uncontrolled handle — a writable value plus the explicit setter it delegates to. */
export interface ControlledValue<T> {
  /**
   * The resolved value. Writable: `value.value = next` runs the same path as `setValue(next)`,
   * so it drops straight into `v-model`. A writable computed rather than a plain ref because the
   * controlled branch must never keep its own copy of the value.
   */
  readonly value: WritableComputedRef<T>;

  /** Sets the next value — updates internal state when uncontrolled, and always fires `onChange`. */
  readonly setValue: (value: T) => void;
}

/**
 * Standard controlled/uncontrolled pattern.
 *
 * - If `controlled` resolves to a defined value, the component is controlled — internal state is
 *   ignored, `setValue` only fires `onChange`.
 * - Otherwise the component owns its state, `setValue` updates it, and `onChange`
 *   still fires for consumers that want to observe changes.
 *
 * Pass `controlled` as a getter (`() => props.value`) so the controlled branch tracks the prop.
 * `default` is read once, at setup — it seeds the uncontrolled state, exactly as the original's
 * `useState(defaultValue)` did.
 */
export function useControlled<T>({
  controlled,
  default: defaultValue,
  onChange,
}: UseControlledOptions<T>): ControlledValue<T> {
  // Cast: `shallowRef`'s return type is a conditional over an unresolved `T`, which leaves
  // `.value` unassignable until `T` is known. The cast pins it to the shape it always has here.
  const uncontrolled = shallowRef(toValue(defaultValue)) as ShallowRef<T>;

  const setValue = (next: T): void => {
    if (toValue(controlled) === undefined) uncontrolled.value = next;
    onChange?.(next);
  };

  const value = computed<T>({
    get: () => {
      const external = toValue(controlled);
      return external === undefined ? uncontrolled.value : external;
    },
    set: setValue,
  });

  return { value, setValue };
}
