// The Vue binding of the permission half — the grant as reactive data, plus the one action that changes it,
// so an "Enable notifications" button is a `permission` switch and a `request` call rather than four refs
// re-declared per consumer.
//
// Two sources, one value. `Notification.permission` is authoritative but silent — it fires no event, so a
// revoke from browser settings or a grant given in another tab would leave a mounted component stale forever.
// The Permissions API fires that event but reports its own vocabulary (`prompt`, not `default`) and is absent
// on older Safari. So the change event is used purely as a SIGNAL: every notification re-reads
// `Notification.permission`, and the Permissions API's own state is never mapped or displayed. Where the API is
// missing, the value is simply the mount-time read plus whatever `request` returns — which is what a consumer
// would have written by hand anyway.
//
// The initial state is `unsupported` rather than a setup-time read, so the server pass and the first client
// render agree and hydration is clean; `onMounted` syncs to the truth immediately after mount. Reading
// `Notification.permission` during setup would throw on the server, where the global does not exist.

import { computed, onMounted, onScopeDispose, shallowRef, type ComputedRef, type ShallowRef } from 'vue';

import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from './NotificationPermission';
import { subscribeToPermissionChange } from './QueryPermission';

/** What {@link useNotificationPermission} returns. */
export interface NotificationPermissionControls {
  /** The current grant. `unsupported` during SSR and until mount, then the real value. */
  readonly permission: Readonly<ShallowRef<NotificationPermissionState>>;

  /** Convenience for `permission === 'granted'` — the gate a `notify` call sits behind. */
  readonly granted: ComputedRef<boolean>;

  /** Whether the Notification API exists at all: `false` only for `unsupported`. Hide the feature when false. */
  readonly supported: ComputedRef<boolean>;

  /** Whether a prompt is worth offering — `permission === 'default'`. False once the user has decided either way. */
  readonly requestable: ComputedRef<boolean>;

  /** Whether a {@link NotificationPermissionControls.request} call is in flight — the button's disabled flag. */
  readonly requesting: Readonly<ShallowRef<boolean>>;

  /**
   * Prompts for the grant and resolves to the resulting state, which is also written to
   * {@link NotificationPermissionControls.permission}. Never throws, never rejects.
   */
  readonly request: () => Promise<NotificationPermissionState>;
}

/**
 * Exposes the notification grant as reactive state, with a `request()` that prompts for it.
 *
 * Updates when the grant changes — on request, and (where the Permissions API is available) on an external
 * grant or revoke. Inherits the module's never-throws contract: `request` resolves to a state, never rejects.
 */
export function useNotificationPermission(): NotificationPermissionControls {
  const permission = shallowRef<NotificationPermissionState>('unsupported');
  const requesting = shallowRef(false);

  let active = false;
  let unsubscribe: (() => void) | undefined;

  const sync = (): void => {
    if (active) permission.value = getNotificationPermission();
  };

  onMounted(() => {
    active = true;
    sync();
    // The delivered state is ignored on purpose — see the header: this subscription is a change signal, and
    // `Notification.permission` is the value. Its immediate first emission is simply a redundant `sync`.
    unsubscribe = subscribeToPermissionChange('notifications', sync);
  });

  onScopeDispose(() => {
    active = false;
    unsubscribe?.();
    unsubscribe = undefined;
  });

  const request = async (): Promise<NotificationPermissionState> => {
    requesting.value = true;
    try {
      const outcome = await requestNotificationPermission();
      permission.value = outcome;
      return outcome;
    } finally {
      // `requestNotificationPermission` is contractually throw-free, but a state machine that can strand itself
      // at `requesting` would disable the button forever, so the reset does not depend on that holding.
      requesting.value = false;
    }
  };

  return {
    permission,
    granted: computed(() => permission.value === 'granted'),
    supported: computed(() => permission.value !== 'unsupported'),
    requestable: computed(() => permission.value === 'default'),
    requesting,
    request,
  };
}
