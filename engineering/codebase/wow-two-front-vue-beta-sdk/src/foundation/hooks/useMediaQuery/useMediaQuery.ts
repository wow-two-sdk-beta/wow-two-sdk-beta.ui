import {
  onMounted,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type ShallowRef,
} from 'vue';

/**
 * Reactively follow a CSS media query. Pass a query string like
 * `'(min-width: 768px)'` or `'(prefers-reduced-motion: reduce)'`, or a ref /
 * getter when the query itself changes.
 *
 * SSR-safe — the ref holds `false` on the server and during the first render,
 * then syncs to the real value once mounted. The subscription is the Vue
 * counterpart of the original's `useSyncExternalStore`: subscribe on mount,
 * unsubscribe when the scope is disposed.
 */
export function useMediaQuery(query: MaybeRefOrGetter<string>): Readonly<ShallowRef<boolean>> {
  const matches = shallowRef(false);

  let mql: MediaQueryList | null = null;
  const onChange = (event: MediaQueryListEvent): void => {
    matches.value = event.matches;
  };

  function unsubscribe(): void {
    mql?.removeEventListener('change', onChange);
    mql = null;
  }

  function subscribe(): void {
    unsubscribe();
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    mql = window.matchMedia(toValue(query));
    matches.value = mql.matches;
    mql.addEventListener('change', onChange);
  }

  onMounted(subscribe);
  // A changed query is a new subscription; `subscribe` drops the old listener first.
  watch(() => toValue(query), subscribe);
  onScopeDispose(unsubscribe);

  return matches;
}
