// The generic Permissions API seam — `navigator.permissions.query`, wrapped so it answers instead of throwing.
//
// It lives in this slice rather than a slice of its own because notifications are the one permission with two
// APIs: `Notification.permission` is authoritative for the grant but fires no event, while this one is the only
// thing that reports a change (a revoke from the browser's site settings, a grant given in another tab). The
// wrapper is written generically because nothing about it is notification-specific — `geolocation`, `camera`,
// `microphone`, `persistent-storage` all answer through the same call.
//
// Three ways this API fails, all of which have to become a state rather than an exception:
//  - absent entirely (SSR, older Safari) — no `navigator`, or no `permissions` on it;
//  - present but ignorant of the name — Safari throws a `TypeError` for a name it doesn't implement rather than
//    resolving, which is why the `try` wraps the call and not only the `await`;
//  - present and answering off-spec — a state string outside the documented three.
//
// All three collapse to `unsupported`: the question was asked and no usable answer came back. That is
// deliberately NOT `prompt` — a consumer must not read "we couldn't tell" as "the user hasn't been asked".

/**
 * The state of a queried permission.
 *
 * - `granted` / `denied` — the user decided.
 * - `prompt` — not decided; requesting the capability will show a prompt.
 * - `unsupported` — no Permissions API, an unknown permission name, or an unreadable answer. Not a state the
 *   platform has; the wrapper's own "no usable answer".
 */
export type PermissionQueryState = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * A permission name. The DOM's `PermissionName` union supplies autocomplete for the well-known names, and the
 * `string` arm keeps the door open for the ones a given engine ships ahead of the type definitions
 * (`accelerometer`, `clipboard-read`, …) — passing one of those is exactly the case `unsupported` exists for.
 */
export type PermissionQueryName = PermissionName | (string & Record<never, never>);

/** Reads `navigator.permissions` if it is there and usable. Guarded end-to-end; returns `undefined` under SSR. */
function permissionsApi(): Permissions | undefined {
  try {
    if (typeof navigator === 'undefined') return undefined;
    const permissions: unknown = navigator.permissions;
    if (typeof permissions !== 'object' || permissions === null) return undefined;
    if (typeof (permissions as Permissions).query !== 'function') return undefined;
    return permissions as Permissions;
  } catch {
    return undefined;
  }
}

/**
 * Maps a `PermissionStatus`'s current `state` onto the union. Exported for the sibling hooks; absent from the
 * barrel. Never throws — an unreadable or off-spec state reads as `unsupported`.
 */
export function readPermissionState(status: PermissionStatus): PermissionQueryState {
  try {
    const state: unknown = status.state;
    if (state === 'granted' || state === 'denied' || state === 'prompt') return state;
  } catch {
    // A throwing `state` getter. Falls through to the same answer as an off-spec value.
  }
  return 'unsupported';
}

/**
 * Resolves the live `PermissionStatus` object for `name`, or `null` when the API is absent, refuses the name,
 * or answers with something that is not a status. Exported for the sibling hooks — which need the object itself
 * to subscribe to — and absent from the barrel, where {@link queryPermission} is the flat answer callers want.
 *
 * Never throws, never rejects.
 */
export async function getPermissionStatus(name: PermissionQueryName): Promise<PermissionStatus | null> {
  const permissions = permissionsApi();
  if (permissions === undefined) return null;

  try {
    // Not `await permissions.query(...)` in isolation: Safari throws synchronously for an unknown name, so the
    // call itself has to sit inside the `try`.
    const status: unknown = await permissions.query({ name: name as PermissionName });
    if (typeof status !== 'object' || status === null) return null;
    return status as PermissionStatus;
  } catch {
    return null;
  }
}

/**
 * Reads a permission's current state.
 *
 * A one-shot read: the answer is a snapshot, and the browser fires no event on this promise. Use
 * `usePermissionState` to follow changes.
 *
 * Never throws, never rejects.
 *
 * @param name The permission to query — `'notifications'`, `'geolocation'`, `'camera'`, …
 */
export async function queryPermission(name: PermissionQueryName): Promise<PermissionQueryState> {
  const status = await getPermissionStatus(name);
  return status === null ? 'unsupported' : readPermissionState(status);
}

/**
 * Subscribes to a permission's `change` event.
 *
 * `onChange` is called once with the current state as soon as the status resolves — including `unsupported`,
 * so a subscriber always hears exactly one answer even where the API is absent — and again on every later
 * change. Exported for the sibling hooks; absent from the barrel, where the hooks are the React-facing form.
 *
 * The returned unsubscribe is synchronous and safe to call before the status has resolved: it cancels the
 * pending attachment as well as detaching an attached listener, so an unmount that beats the promise leaks
 * nothing. Never throws; a throwing `onChange` is swallowed.
 *
 * @param name The permission to follow.
 * @param onChange Called with the current state, then on every change.
 * @returns The unsubscribe function.
 */
export function subscribeToPermissionChange(
  name: PermissionQueryName,
  onChange: (state: PermissionQueryState) => void,
): () => void {
  let cancelled = false;
  let detach: (() => void) | undefined;

  /** Hands the subscriber a state, absorbing a throw from their own callback. */
  const emit = (state: PermissionQueryState): void => {
    try {
      onChange(state);
    } catch {
      // The subscriber's handler failed. Their problem, not a reason to break the subscription.
    }
  };

  void getPermissionStatus(name).then(
    (status) => {
      if (cancelled) return;
      if (status === null) {
        emit('unsupported');
        return;
      }

      emit(readPermissionState(status));

      const listener = (): void => {
        if (!cancelled) emit(readPermissionState(status));
      };
      try {
        status.addEventListener('change', listener);
        detach = () => {
          try {
            status.removeEventListener('change', listener);
          } catch {
            // A stand-in without a full `EventTarget` surface. Nothing to detach from.
          }
        };
      } catch {
        // No usable `addEventListener` — the one emitted state stands, with no updates after it.
      }
    },
    // `getPermissionStatus` is contractually non-rejecting; the handler exists so a future edit to it cannot
    // turn this fire-and-forget `then` into an unhandled rejection.
    () => {
      if (!cancelled) emit('unsupported');
    },
  );

  return () => {
    cancelled = true;
    detach?.();
    detach = undefined;
  };
}
