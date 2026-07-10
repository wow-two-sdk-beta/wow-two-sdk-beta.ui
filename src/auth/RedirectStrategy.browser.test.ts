import { describe, it, expect, vi, type Mock } from 'vitest';

import type { CookieAuthClient } from './CookieStrategy';
import { createRedirectStrategy } from './RedirectStrategy';

interface Me {
  readonly id: string;
}

const me: Me = { id: '1' };

function fakeClient(): CookieAuthClient & { get: Mock; post: Mock } {
  const get = vi.fn(async () => me);
  const post = vi.fn(async () => undefined);
  // Cast: a mock's concrete return type cannot satisfy the client's per-call generic.
  return { get, post } as unknown as CookieAuthClient & { get: Mock; post: Mock };
}

describe('createRedirectStrategy', () => {
  it('signIn navigates to the default challenge URL with the encoded return path', () => {
    const navigate = vi.fn();
    const strategy = createRedirectStrategy<Me>({ client: fakeClient(), navigate });

    strategy.signIn?.('/library?q=1', {});
    expect(navigate).toHaveBeenCalledWith('/api/identity/sign-in?returnUrl=%2Flibrary%3Fq%3D1');
  });

  it('signIn defaults the return path to the current pathname + search', () => {
    const navigate = vi.fn();
    const strategy = createRedirectStrategy<Me>({ client: fakeClient(), navigate });

    strategy.signIn?.(undefined, {});
    const expected = window.location.pathname + window.location.search;
    expect(navigate).toHaveBeenCalledWith(`/api/identity/sign-in?returnUrl=${encodeURIComponent(expected)}`);
  });

  it('honors a custom sign-in path and return-url param', () => {
    const navigate = vi.fn();
    const strategy = createRedirectStrategy<Me>({
      client: fakeClient(),
      navigate,
      signInPath: '/auth/challenge',
      returnUrlParam: 'returnTo',
    });

    strategy.signIn?.('/dash', {});
    expect(navigate).toHaveBeenCalledWith('/auth/challenge?returnTo=%2Fdash');
  });

  it('buildSignInUrl overrides the URL shape entirely', () => {
    const navigate = vi.fn();
    const strategy = createRedirectStrategy<Me>({
      client: fakeClient(),
      navigate,
      buildSignInUrl: (returnUrl) => `/login#next=${returnUrl}`,
    });

    strategy.signIn?.('/x', {});
    expect(navigate).toHaveBeenCalledWith('/login#next=/x');
  });

  it('delegates the me-resolve to the cookie strategy', async () => {
    const client = fakeClient();
    const strategy = createRedirectStrategy<Me>({ client, navigate: vi.fn() });

    await expect(strategy.resolveUser({})).resolves.toEqual(me);
    expect(client.get).toHaveBeenCalledWith('/api/identity/me', undefined);
  });

  it('delegates sign-out to the cookie strategy', async () => {
    const client = fakeClient();
    const strategy = createRedirectStrategy<Me>({ client, navigate: vi.fn() });

    await strategy.signOut?.({});
    expect(client.post).toHaveBeenCalledWith('/api/identity/sign-out', undefined);
  });
});
