import type { Ref } from 'react';

type PossibleRef<T> = Ref<T> | undefined;

function setRef<T>(ref: PossibleRef<T>, value: T): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref != null) {
    (ref as { current: T | null }).current = value;
  }
}

/**
 * Merge multiple React refs (callback or object) into a single callback ref.
 * Use to forward a ref while also keeping a local ref to the same node.
 */
export function composeRefs<T>(...refs: PossibleRef<T>[]): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) setRef(ref, node as T);
  };
}
