// The React binding of the permission half — the grant as render-time data, plus the one action that changes
// it, so an "Enable notifications" button is a `permission` switch and a `request` call rather than four
// `useState`s re-declared per consumer.
//
// Two sources, one value. `Notification.permission` is authoritative but silent — it fires no event, so a
// revoke from browser settings or a grant given in another tab would leave a mounted component stale forever.
// The Permissions API fires that event but reports its own vocabulary (`prompt`, not `default`) and is absent
// on older Safari. So the change event is used purely as a SIGNAL: every notification re-reads
// `Notification.permission`, and the Permissions API's own state is never mapped or displayed. Where the API is
// missing, the value is simply the mount-time read plus whatever `request` returns — which is what a consumer
// would have written by hand anyway.
//
// The initial state is `unsupported` rather than a render-time read, so the server pass and the first client
// render agree and hydration is clean; the effect syncs to the truth immediately after mount.

import { useCallback, useEffect, useState } from 'react';

import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from './NotificationPermission';
import { subscribeToPermissionChange } from './QueryPermission';

/** What {@link useNotificationPermission} returns. */
export interface NotificationPermissionControls {
  /** The current grant. `unsupported` during SSR and for the first client render, then the real value. */
  readonly permission: NotificationPermissionState;

  /** Convenience for `permission === 'granted'` — the gate a `notify` call sits behind. */
  readonly granted: boolean;

  /** Whether the Notification API exists at all: `false` only for `unsupported`. Hide the feature when false. */
  readonly supported: boolean;

  /** Whether a prompt is worth offering — `permission === 'default'`. False once the user has decided either way. */
  readonly requestable: boolean;

  /** Whether a {@link NotificationPermissionControls.request} call is in flight — the button's disabled flag. */
  readonly requesting: boolean;

  /**
   * Prompts for the grant and resolves to the resulting state, which is also written to
   * {@link NotificationPermissionControls.permission}. Stable across renders; never throws, never rejects.
   */
  readonly request: () => Promise<NotificationPermissionState>;
}

/**
 * Exposes the notification grant as state, with a `request()` that prompts for it.
 *
 * Re-renders when the grant changes — on request, and (where the Permissions API is available) on an external
 * grant or revoke. Inherits the module's never-throws contract: `request` resolves to a state, never rejects.
 */
export function useNotificationPermission(): NotificationPermissionControls {
  const [permission, setPermission] = useState<NotificationPermissionState>('unsupported');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let active = true;
    const sync = (): void => {
      if (active) setPermission(getNotificationPermission());
    };

    sync();
    // The delivered state is ignored on purpose — see the header: this subscription is a change signal, and
    // `Notification.permission` is the value. Its immediate first emission is simply a redundant `sync`.
    const unsubscribe = subscribeToPermissionChange('notifications', sync);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const request = useCallback(async (): Promise<NotificationPermissionState> => {
    setRequesting(true);
    try {
      const outcome = await requestNotificationPermission();
      setPermission(outcome);
      return outcome;
    } finally {
      // `requestNotificationPermission` is contractually throw-free, but a state machine that can strand itself
      // at `requesting` would disable the button forever, so the reset does not depend on that holding.
      setRequesting(false);
    }
  }, []);

  return {
    permission,
    granted: permission === 'granted',
    supported: permission !== 'unsupported',
    requestable: permission === 'default',
    requesting,
    request,
  };
}
