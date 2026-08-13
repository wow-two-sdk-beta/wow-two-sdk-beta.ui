// The Vue binding of the Permissions API — a permission's state as reactive data, kept current by the
// platform's `change` event and torn down when the scope is disposed.
//
// The state is `null` until the first answer arrives. The query is asynchronous and there is no synchronous
// snapshot to read, so seeding the ref with a real-looking value would have to invent a server value and a
// first-paint value — and any invented value here is a lie that flips a moment later: rendering "Blocked" or
// "Not supported" for one frame before the real answer lands is worse than rendering nothing. `null` says
// exactly what is true — not known yet — and covers the SSR pass unchanged.
//
// The subscription is attached in `onMounted`, never in an immediate watcher: `subscribeToPermissionChange`
// reaches for `navigator`, which does not exist during a server render.

import { onMounted, onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from 'vue';

import {
  subscribeToPermissionChange,
  type PermissionQueryName,
  type PermissionQueryState,
} from './QueryPermission';

/**
 * Follows a permission's state reactively, updating when the user grants or revokes it — including from
 * the browser's own site settings or another tab.
 *
 * Holds `null` while the first query is in flight (and during SSR), then a {@link PermissionQueryState}.
 * Changing `name` resets to `null` and re-queries. Never throws.
 *
 * @param name The permission to follow — `'notifications'`, `'geolocation'`, `'camera'`, … A ref or getter
 *   re-queries when it changes.
 * @returns The current state, or `null` before the first answer.
 */
export function usePermissionState(
  name: MaybeRefOrGetter<PermissionQueryName>,
): Readonly<ShallowRef<PermissionQueryState | null>> {
  const state = shallowRef<PermissionQueryState | null>(null);

  let unsubscribe: (() => void) | undefined;

  function stop(): void {
    unsubscribe?.();
    unsubscribe = undefined;
  }

  function start(): void {
    stop();
    // A new `name` invalidates the previous answer immediately — showing the old permission's state under the
    // new name's label would be simply wrong, where `null` is merely uninformative.
    state.value = null;
    unsubscribe = subscribeToPermissionChange(toValue(name), (next) => {
      state.value = next;
    });
  }

  onMounted(start);
  // Non-immediate on purpose: an immediate watcher runs on the server, where `navigator` is absent.
  watch(() => toValue(name), start);
  onScopeDispose(stop);

  return state;
}
