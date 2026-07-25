// The React binding of the Permissions API — a permission's state as render-time data, kept current by the
// platform's `change` event and torn down on unmount.
//
// The state is `null` until the first answer arrives. The query is asynchronous and there is no synchronous
// snapshot to read, so a `useSyncExternalStore` shape would have to invent a server value and a first-paint
// value — and any invented value here is a lie that flips a moment later: rendering "Blocked" or "Not
// supported" for one frame before the real answer lands is worse than rendering nothing. `null` says exactly
// what is true — not known yet — and covers the SSR pass unchanged.

import { useEffect, useState } from 'react';

import { subscribeToPermissionChange, type PermissionQueryName, type PermissionQueryState } from './QueryPermission';

/**
 * Follows a permission's state reactively, re-rendering when the user grants or revokes it — including from
 * the browser's own site settings or another tab.
 *
 * Returns `null` while the first query is in flight (and during SSR), then a {@link PermissionQueryState}.
 * Changing `name` resets to `null` and re-queries. Never throws.
 *
 * @param name The permission to follow — `'notifications'`, `'geolocation'`, `'camera'`, …
 * @returns The current state, or `null` before the first answer.
 */
export function usePermissionState(name: PermissionQueryName): PermissionQueryState | null {
  const [state, setState] = useState<PermissionQueryState | null>(null);

  useEffect(() => {
    let active = true;
    // A new `name` invalidates the previous answer immediately — showing the old permission's state under the
    // new name's label would be simply wrong, where `null` is merely uninformative.
    setState(null);

    const unsubscribe = subscribeToPermissionChange(name, (next) => {
      if (active) setState(next);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [name]);

  return state;
}
