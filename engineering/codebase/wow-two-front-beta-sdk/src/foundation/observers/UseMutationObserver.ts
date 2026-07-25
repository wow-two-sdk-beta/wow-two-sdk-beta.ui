// `useMutationObserver` — react to DOM changes made by code this component does not own: a third-party widget
// that injects nodes, a portal target filling in, a `contenteditable` the user is typing into, an external
// script toggling an attribute. Inside React you use state; this is the escape hatch for everything outside it.
//
// THE CALLBACK IS READ FROM A REF, so consumers never have to memoize it. Mutation callbacks are usually written
// inline and usually close over fresh props; forcing a `useCallback` would mean an un-memoized caller silently
// re-subscribes on every render, and a re-subscribed `MutationObserver` misses any mutation in the gap. Reading
// through a ref means the latest closure always runs while the subscription itself stays untouched.
//
// SUBSCRIPTION LIFECYCLE IS THE SAME NO-DEPS-EFFECT SHAPE AS `UseInView`: a `RefObject` mutating does not
// re-render, so the observed node is re-checked after every render and re-subscribed only when it actually
// changed. Options are compared through `mutationSignature`, not by object identity, so an inline options
// literal (the normal thing to write) does not churn the subscription.
//
// RECORDS ARRIVE AS A BATCH AND ARE PASSED THROUGH AS ONE. They are a transaction; see `ObserveMutation`.
//
// NO `once` KNOB. Unlike an intersection, "the DOM changed once" is almost never the interesting event — the
// consumer wants the mutations for as long as the node is mounted. A caller that genuinely wants one shot
// disconnects from inside the callback, which is why the observer is handed to it.

import { useEffect, useRef, type RefObject } from 'react';

import {
  mutationSignature,
  observeMutation,
  supportsMutationObserver,
  type Disposer,
  type MutationOptions,
} from './ObserveMutation';

/** The `MutationObserverInit` flags plus the one lifecycle knob. */
export interface UseMutationObserverOptions extends MutationOptions {
  /** Suspend observation without unmounting. Flipping it back re-subscribes to the current `ref.current`. */
  readonly disabled?: boolean;
}

/**
 * Runs `callback` whenever the node behind `ref` mutates.
 *
 * With no options, watches `childList` — additions and removals of direct children. Add `subtree: true` to
 * extend that (and every other flag) to descendants.
 *
 * Records describe what ALREADY happened; the DOM is in its post-mutation state by the time the callback runs.
 *
 * @param ref Points at the node to watch. May change which node it points at between renders.
 * @param callback Receives the batch of records plus the observer, so a caller can disconnect from inside.
 * @param options Which mutation kinds to report, plus `disabled`.
 */
export function useMutationObserver<T extends Node>(
  ref: RefObject<T | null>,
  callback: (records: readonly MutationRecord[], observer: MutationObserver) => void,
  options?: UseMutationObserverOptions,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const disposeRef = useRef<Disposer | null>(null);
  const observedRef = useRef<Node | null>(null);
  const signatureRef = useRef<string | null>(null);

  const signature = mutationSignature(options);
  const disabled = options?.disabled ?? false;

  // No dependency array — runs after every render and diffs; see the header.
  useEffect(() => {
    const node = disabled ? null : ref.current;
    if (node === observedRef.current && signature === signatureRef.current) return;

    disposeRef.current?.();
    disposeRef.current = null;
    observedRef.current = node;
    signatureRef.current = signature;

    if (!node || !supportsMutationObserver()) return;

    disposeRef.current = observeMutation(
      node,
      (records, observer) => callbackRef.current(records, observer),
      optionsRef.current,
    );
  });

  useEffect(
    () => () => {
      disposeRef.current?.();
      disposeRef.current = null;
      observedRef.current = null;
      signatureRef.current = null;
    },
    [],
  );
}
