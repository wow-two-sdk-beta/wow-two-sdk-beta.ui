import { act, cleanup, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import { afterEach, describe, it, expect, beforeEach } from 'vitest';

import { RoutePersistence } from './RoutePersistence';

const Key = 'app:lastRoute';

afterEach(cleanup);

/** Surfaces the current path so tests can assert route restoration. */
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname + location.search}</div>;
}

/** Renders the persister, a location probe, and the routed outlet. */
function Harness({ storageKey, restore }: { readonly storageKey?: string; readonly restore?: boolean }) {
  return (
    <>
      <RoutePersistence storageKey={storageKey} restore={restore} />
      <LocationProbe />
      <Outlet />
    </>
  );
}

function makeRouter(initial: string, props: { storageKey?: string; restore?: boolean } = {}) {
  return createMemoryRouter(
    [
      {
        element: <Harness {...props} />,
        children: [
          { index: true, element: <p>home</p> },
          { path: 'projects', element: <p>projects</p> },
          { path: 'library', element: <p>library</p> },
        ],
      },
    ],
    { initialEntries: [initial] },
  );
}

describe('RoutePersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes the current route to localStorage on the initial entry and each navigation', async () => {
    const router = makeRouter('/');
    render(<RouterProvider router={router} />);

    expect(localStorage.getItem(Key)).toBe('/');

    await act(async () => {
      await router.navigate('/library?q=1');
    });

    expect(localStorage.getItem(Key)).toBe('/library?q=1');
  });

  it('uses a custom storage key', () => {
    const router = makeRouter('/', { storageKey: 'custom:key' });
    render(<RouterProvider router={router} />);

    expect(localStorage.getItem('custom:key')).toBe('/');
  });

  it('restores the saved non-root route on first mount when at the app root', async () => {
    localStorage.setItem(Key, '/library');
    const router = makeRouter('/', { restore: true });
    const { getByTestId } = render(<RouterProvider router={router} />);

    await waitFor(() => expect(getByTestId('path').textContent).toBe('/library'));
  });

  it('does not restore when restore is not set', async () => {
    localStorage.setItem(Key, '/library');
    const router = makeRouter('/');
    const { getByTestId } = render(<RouterProvider router={router} />);

    await act(async () => {});
    expect(getByTestId('path').textContent).toBe('/');
  });

  it('does not restore when the entry route is not the app root (never fights an index redirect)', async () => {
    localStorage.setItem(Key, '/library');
    const router = makeRouter('/projects', { restore: true });
    const { getByTestId } = render(<RouterProvider router={router} />);

    await act(async () => {});
    expect(getByTestId('path').textContent).toBe('/projects');
    expect(localStorage.getItem(Key)).toBe('/projects');
  });

  it('does not restore when the saved route is itself the app root', async () => {
    localStorage.setItem(Key, '/');
    const router = makeRouter('/', { restore: true });
    const { getByTestId } = render(<RouterProvider router={router} />);

    await act(async () => {});
    expect(getByTestId('path').textContent).toBe('/');
  });
});
