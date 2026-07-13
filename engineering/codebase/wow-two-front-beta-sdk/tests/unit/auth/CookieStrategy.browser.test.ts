import { describe, it, expect, vi, type Mock } from 'vitest';

import { ApiError } from '@src/foundation/http';

import { createCookieStrategy, type CookieAuthClient } from '@src/auth/CookieStrategy';

interface Me {
  readonly id: string;
  readonly kind: 'anonymous' | 'guest' | 'user';
}

const user: Me = { id: '1', kind: 'user' };

/** Builds a fake `get`/`post` client whose `get` resolves (or rejects) with the given outcome. */
function fakeClient(me: Me | Promise<never> = user): CookieAuthClient & { get: Mock; post: Mock } {
  const get = vi.fn(() => (me instanceof Promise ? me : Promise.resolve(me)));
  const post = vi.fn(async () => undefined);
  // Cast: a mock's concrete return type cannot satisfy the client's per-call generic.
  return { get, post } as unknown as CookieAuthClient & { get: Mock; post: Mock };
}

describe('createCookieStrategy', () => {
  it('resolves the user via GET on the default me path', async () => {
    const client = fakeClient();
    const strategy = createCookieStrategy<Me>({ client });

    await expect(strategy.resolveUser({})).resolves.toEqual(user);
    expect(client.get).toHaveBeenCalledWith('/api/identity/me', undefined);
  });

  it('honors a custom me path and forwards the abort signal', async () => {
    const client = fakeClient();
    const strategy = createCookieStrategy<Me>({ client, mePath: '/identity/whoami' });
    const controller = new AbortController();

    await strategy.resolveUser({ signal: controller.signal });
    expect(client.get).toHaveBeenCalledWith('/identity/whoami', { signal: controller.signal });
  });

  it('maps a 401 me-response to null (signed out, not a failure)', async () => {
    const client = fakeClient(Promise.reject(new ApiError(401, null)));
    const strategy = createCookieStrategy<Me>({ client });

    await expect(strategy.resolveUser({})).resolves.toBeNull();
  });

  it('propagates non-401 failures for the provider to report', async () => {
    const failure = new ApiError(503, null, 'down');
    const client = fakeClient(Promise.reject(failure));
    const strategy = createCookieStrategy<Me>({ client });

    await expect(strategy.resolveUser({})).rejects.toBe(failure);
  });

  it('treats a 200 me-response as signed out when isAnonymous says so (guest gate)', async () => {
    const anonymous: Me = { id: '0', kind: 'anonymous' };
    const strategy = createCookieStrategy<Me>({
      client: fakeClient(anonymous),
      isAnonymous: (me) => me.kind === 'anonymous',
    });

    await expect(strategy.resolveUser({})).resolves.toBeNull();
  });

  it('signOut posts the default sign-out path', async () => {
    const client = fakeClient();
    const strategy = createCookieStrategy<Me>({ client });

    await strategy.signOut?.({});
    expect(client.post).toHaveBeenCalledWith('/api/identity/sign-out', undefined);
  });

  it('signOut posts a custom path (e.g. /api/auth/logout)', async () => {
    const client = fakeClient();
    const strategy = createCookieStrategy<Me>({ client, signOutPath: '/api/auth/logout' });

    await strategy.signOut?.({});
    expect(client.post).toHaveBeenCalledWith('/api/auth/logout', undefined);
  });

  it('signOutPath: null skips the server call entirely', async () => {
    const client = fakeClient();
    const strategy = createCookieStrategy<Me>({ client, signOutPath: null });

    await strategy.signOut?.({});
    expect(client.post).not.toHaveBeenCalled();
  });

  it('a custom signIn receives the input and the client (guest-creation shape)', async () => {
    const guest: Me = { id: 'g1', kind: 'guest' };
    const client = fakeClient();
    client.post.mockResolvedValue(guest);
    const strategy = createCookieStrategy<Me, undefined>({
      client,
      signIn: (_input, context) => context.client.post<Me>('/api/identity/guest'),
    });

    await expect(strategy.signIn?.(undefined, {})).resolves.toEqual(guest);
    expect(client.post).toHaveBeenCalledWith('/api/identity/guest');
  });

  it('leaves signIn undefined when no exchange is configured', () => {
    const strategy = createCookieStrategy<Me>({ client: fakeClient() });
    expect(strategy.signIn).toBeUndefined();
  });
});
