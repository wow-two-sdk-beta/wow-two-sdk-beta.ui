import { describe, it, expect, vi } from 'vitest';

import { createBearerStrategy } from './BearerStrategy';
import { createMemoryTokenStorage, type TokenStorage } from './TokenStorage';

interface Admin {
  readonly name: string;
}

const admin: Admin = { name: 'root' };

describe('createBearerStrategy', () => {
  it('resolves null with no stored token (anonymous boot)', async () => {
    const strategy = createBearerStrategy<Admin, string>({
      authenticate: async () => ({ token: 't-1', user: admin }),
    });

    await expect(strategy.resolveUser({})).resolves.toBeNull();
    expect(strategy.getAuthToken()).toBeNull();
  });

  it('signIn exchanges credentials, stores the token, and hands back the user', async () => {
    const authenticate = vi.fn(async (password: string) => ({ token: `t-${password}`, user: admin }));
    const strategy = createBearerStrategy<Admin, string>({ authenticate });

    await expect(strategy.signIn?.('hunter2', {})).resolves.toEqual(admin);
    expect(authenticate).toHaveBeenCalledWith('hunter2', {});
    expect(strategy.getAuthToken()).toBe('t-hunter2'); // ready to feed createApiClient({ getAuthToken })
  });

  it('round-trips through a custom token storage delegate', async () => {
    let stored: string | null = null;
    const tokenStorage: TokenStorage = {
      get: vi.fn(() => stored),
      set: vi.fn((next) => {
        stored = next;
      }),
    };
    const strategy = createBearerStrategy<Admin, string>({
      tokenStorage,
      authenticate: async () => ({ token: 't-1', user: admin }),
    });

    await strategy.signIn?.('pw', {});
    expect(tokenStorage.set).toHaveBeenCalledWith('t-1');
    expect(strategy.getAuthToken()).toBe('t-1');

    await strategy.signOut?.({});
    expect(tokenStorage.set).toHaveBeenCalledWith(null);
    expect(strategy.getAuthToken()).toBeNull();
    expect(strategy.tokenStorage).toBe(tokenStorage);
  });

  it('restores a persisted token through resolveUser', async () => {
    const tokenStorage = createMemoryTokenStorage();
    tokenStorage.set('persisted');
    const resolveUser = vi.fn(async ({ token }: { token: string }) => (token === 'persisted' ? admin : null));
    const strategy = createBearerStrategy<Admin, string>({
      tokenStorage,
      resolveUser,
      authenticate: async () => ({ token: 't', user: admin }),
    });

    await expect(strategy.resolveUser({})).resolves.toEqual(admin);
    expect(resolveUser).toHaveBeenCalledWith({ token: 'persisted' });
    expect(strategy.getAuthToken()).toBe('persisted');
  });

  it('discards a persisted token when no resolveUser can rebuild the user', async () => {
    const tokenStorage = createMemoryTokenStorage();
    tokenStorage.set('orphan');
    const strategy = createBearerStrategy<Admin, string>({
      tokenStorage,
      authenticate: async () => ({ token: 't', user: admin }),
    });

    await expect(strategy.resolveUser({})).resolves.toBeNull();
    expect(strategy.getAuthToken()).toBeNull(); // dead token dropped — no stale Authorization header
  });

  it('clears the token when resolveUser reports it no longer stands for a user', async () => {
    const tokenStorage = createMemoryTokenStorage();
    tokenStorage.set('revoked');
    const strategy = createBearerStrategy<Admin, string>({
      tokenStorage,
      resolveUser: async () => null,
      authenticate: async () => ({ token: 't', user: admin }),
    });

    await expect(strategy.resolveUser({})).resolves.toBeNull();
    expect(strategy.getAuthToken()).toBeNull();
  });

  it('keeps the token when resolveUser throws (transient failure is not a revoke)', async () => {
    const tokenStorage = createMemoryTokenStorage();
    tokenStorage.set('still-good');
    const failure = new Error('offline');
    const strategy = createBearerStrategy<Admin, string>({
      tokenStorage,
      resolveUser: () => Promise.reject(failure),
      authenticate: async () => ({ token: 't', user: admin }),
    });

    await expect(strategy.resolveUser({})).rejects.toBe(failure);
    expect(strategy.getAuthToken()).toBe('still-good');
  });

  it('signOut runs the server revoke and clears the token even when the revoke rejects', async () => {
    const failure = new Error('revoke failed');
    const signOut = vi.fn(() => Promise.reject(failure));
    const strategy = createBearerStrategy<Admin, string>({
      authenticate: async () => ({ token: 't-1', user: admin }),
      signOut,
    });
    await strategy.signIn?.('pw', {});

    await expect(strategy.signOut?.({})).rejects.toBe(failure);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(strategy.getAuthToken()).toBeNull();
  });

  it('onUnauthorized drops the token (bridged 401)', async () => {
    const strategy = createBearerStrategy<Admin, string>({
      authenticate: async () => ({ token: 't-1', user: admin }),
    });
    await strategy.signIn?.('pw', {});
    expect(strategy.getAuthToken()).toBe('t-1');

    strategy.onUnauthorized?.();
    expect(strategy.getAuthToken()).toBeNull();
  });
});
