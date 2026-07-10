import { describe, it, expect, vi } from 'vitest';

import { createAuthBridge } from './AuthBridge';
import { AuthStatus, type AuthSession } from './AuthSession';

interface User {
  readonly id: string;
}

const authenticated = (user: User): AuthSession<User> => ({ status: AuthStatus.Authenticated, user });
const anonymous: AuthSession<User> = { status: AuthStatus.Anonymous, user: null };
const resolving: AuthSession<User> = { status: AuthStatus.Resolving, user: null };

describe('createAuthBridge', () => {
  it('starts with an unknown session snapshot', () => {
    const bridge = createAuthBridge<User>();
    expect(bridge.getSession()).toEqual({ status: AuthStatus.Unknown, user: null });
  });

  it('publishSession updates the snapshot and notifies subscribers until unsubscribed', () => {
    const bridge = createAuthBridge<User>();
    const listener = vi.fn();
    const unsubscribe = bridge.subscribeSession(listener);

    bridge.publishSession(authenticated({ id: '1' }));
    expect(bridge.getSession()).toEqual(authenticated({ id: '1' }));
    expect(listener).toHaveBeenCalledWith(authenticated({ id: '1' }));

    unsubscribe();
    bridge.publishSession(anonymous);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(bridge.getSession()).toEqual(anonymous);
  });

  it('isAuthenticated resolves immediately for settled sessions', async () => {
    const bridge = createAuthBridge<User>();
    bridge.publishSession(authenticated({ id: '1' }));
    await expect(bridge.isAuthenticated()).resolves.toBe(true);

    bridge.publishSession(anonymous);
    await expect(bridge.isAuthenticated()).resolves.toBe(false);
  });

  it('isAuthenticated waits for an unsettled session to settle', async () => {
    const bridge = createAuthBridge<User>();
    const outcomes: boolean[] = [];
    const first = bridge.isAuthenticated().then((v) => outcomes.push(v)); // taken at `unknown`

    bridge.publishSession(resolving);
    expect(outcomes).toEqual([]); // still pending — resolving is not settled

    bridge.publishSession(authenticated({ id: '1' }));
    await first;
    expect(outcomes).toEqual([true]);
  });

  it('isAuthenticated pends again while a refresh is resolving', async () => {
    const bridge = createAuthBridge<User>();
    bridge.publishSession(authenticated({ id: '1' }));
    bridge.publishSession(resolving); // refresh in flight — checks must wait for the fresh result

    const pending = bridge.isAuthenticated();
    bridge.publishSession(anonymous);
    await expect(pending).resolves.toBe(false);
  });

  it('onUnauthorized fans out to subscribers with the error until unsubscribed', () => {
    const bridge = createAuthBridge<User>();
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = bridge.subscribeUnauthorized(first);
    bridge.subscribeUnauthorized(second);

    const error = new Error('401');
    bridge.onUnauthorized(error);
    expect(first).toHaveBeenCalledWith(error);
    expect(second).toHaveBeenCalledWith(error);

    unsubscribeFirst();
    bridge.onUnauthorized(error);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('onUnauthorized is a safe no-op with no provider subscribed', () => {
    const bridge = createAuthBridge<User>();
    expect(() => bridge.onUnauthorized(new Error('401'))).not.toThrow();
  });
});
