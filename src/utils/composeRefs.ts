import { useCallback, type Ref } from 'react';

type PossibleRef<T> = Ref<T> | undefined;

function setRef<T>(ref: PossibleRef<T>, value: T | null): (() => void) | void {
  if (typeof ref === 'function') {
    return ref(value);
  } else if (ref != null) {
    (ref as { current: T | null }).current = value;
  }
}

/**
 * Merge multiple React refs (callback or object) into a single callback ref.
 * Use to forward a ref while also keeping a local ref to the same node.
 *
 * React 19 callback refs may return a cleanup function; the composed ref
 * preserves them — it returns a cleanup that invokes each inner cleanup
 * (and null-calls refs that returned none).
 */
export function composeRefs<T>(
  ...refs: PossibleRef<T>[]
): (node: T | null) => (() => void) | void {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (typeof cleanup === 'function') hasCleanup = true;
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < refs.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup === 'function') cleanup();
          else setRef(refs[i], null);
        }
      };
    }
  };
}

/**
 * `composeRefs` with a render-stable identity — memoized so React doesn't
 * detach/reattach the composed ref on every commit.
 */
export function useComposedRefs<T>(
  ...refs: PossibleRef<T>[]
): (node: T | null) => (() => void) | void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(composeRefs(...refs), refs);
}
