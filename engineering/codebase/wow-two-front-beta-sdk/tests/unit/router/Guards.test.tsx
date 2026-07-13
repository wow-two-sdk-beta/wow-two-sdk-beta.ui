import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, it, expect } from 'vitest';

import { buildReturnTo, requireAuth, resolveReturnTo, useReturnTo } from '@src/router/Guards';
import type { GuardContext } from '@src/router/RouteConfig';

afterEach(cleanup);

/** A minimal GuardContext for a given absolute request URL. */
function guardContext(url: string): GuardContext {
  return { request: new Request(url), params: {} };
}

describe('requireAuth', () => {
  it('allows activation when authenticated', async () => {
    const guard = requireAuth(() => true);
    await expect(guard(guardContext('https://x/app/secret?y=1'))).resolves.toBe(true);
  });

  it('redirects to login capturing the attempted path+search as returnTo', async () => {
    const guard = requireAuth(() => false);
    const result = await guard(guardContext('https://x/app/secret?y=1'));

    expect(result).toEqual({ redirect: '/login?returnTo=%2Fapp%2Fsecret%3Fy%3D1' });

    // Round-trip: the captured returnTo decodes back to the page the user wanted.
    const { redirect } = result as { redirect: string };
    expect(resolveReturnTo(new URL(redirect, 'http://localhost').search)).toBe('/app/secret?y=1');
  });

  it('awaits an async isAuthenticated and honors a custom loginPath', async () => {
    const guard = requireAuth(async () => false, '/signin');
    await expect(guard(guardContext('https://x/library'))).resolves.toEqual({
      redirect: '/signin?returnTo=%2Flibrary',
    });
  });
});

describe('buildReturnTo', () => {
  it('encodes path+search from a full URL, dropping the origin', () => {
    expect(buildReturnTo('/login', 'https://x/app/secret?y=1')).toBe(
      '/login?returnTo=%2Fapp%2Fsecret%3Fy%3D1',
    );
    expect(buildReturnTo('/login', 'https://host:8232/a/b')).toBe('/login?returnTo=%2Fa%2Fb');
  });
});

describe('resolveReturnTo', () => {
  const withReturnTo = (raw: string) => `?returnTo=${encodeURIComponent(raw)}`;

  it('round-trips a safe same-origin path (string or URLSearchParams)', () => {
    expect(resolveReturnTo('?returnTo=%2Fapp%2Fsecret%3Fy%3D1')).toBe('/app/secret?y=1');
    expect(resolveReturnTo(new URLSearchParams({ returnTo: '/library' }))).toBe('/library');
  });

  it('falls back when returnTo is absent', () => {
    expect(resolveReturnTo('?other=1')).toBe('/');
    expect(resolveReturnTo('', '/home')).toBe('/home');
  });

  it('rejects open-redirect targets → fallback', () => {
    expect(resolveReturnTo(withReturnTo('//evil.com'))).toBe('/'); // protocol-relative
    expect(resolveReturnTo(withReturnTo('https://evil.com'))).toBe('/'); // absolute external
    expect(resolveReturnTo(withReturnTo('/\\evil'))).toBe('/'); // '/\evil' → browsers normalize to '//evil'
    expect(resolveReturnTo(withReturnTo('\\\\evil.com'), '/safe')).toBe('/safe'); // '\\evil.com'
  });
});

describe('useReturnTo', () => {
  function readReturnTo(entry: string, fallback?: string): string {
    function Probe() {
      return <span data-testid="rt">{useReturnTo(fallback)}</span>;
    }
    const router = createMemoryRouter([{ path: '/login', element: <Probe /> }], {
      initialEntries: [entry],
    });
    render(<RouterProvider router={router} />);
    return screen.getByTestId('rt').textContent ?? '';
  }

  it('reads and returns a safe returnTo from the current URL', () => {
    expect(readReturnTo('/login?returnTo=%2Fapp%2Fsecret%3Fy%3D1')).toBe('/app/secret?y=1');
  });

  it('falls back for an unsafe returnTo (open-redirect guard)', () => {
    expect(readReturnTo(`/login?returnTo=${encodeURIComponent('//evil.com')}`)).toBe('/');
  });

  it('honors a custom fallback when returnTo is absent', () => {
    expect(readReturnTo('/login', '/home')).toBe('/home');
  });
});
