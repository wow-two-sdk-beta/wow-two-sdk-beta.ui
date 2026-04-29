import { useCallback, useRef, useState } from 'react';

interface UseControlledOptions<T> {
  controlled: T | undefined;
  default: T;
  onChange?: (value: T) => void;
}

/**
 * Standard controlled/uncontrolled pattern.
 *
 * - If `controlled` is defined, the component is controlled — internal state is
 *   ignored, `setValue` only fires `onChange`.
 * - Otherwise the component owns its state, `setValue` updates it, and `onChange`
 *   still fires for consumers that want to observe changes.
 */
export function useControlled<T>({
  controlled,
  default: defaultValue,
  onChange,
}: UseControlledOptions<T>): [T, (value: T) => void] {
  const [uncontrolled, setUncontrolled] = useState<T>(defaultValue);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : uncontrolled;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [value, setValue];
}
