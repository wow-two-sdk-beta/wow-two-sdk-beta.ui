import { cleanup, render } from '@testing-library/react';
import { Outlet, RouterProvider, createMemoryRouter, type RouteObject } from 'react-router-dom';
import { afterEach, describe, it, expect } from 'vitest';

import { useBreadcrumbs, type Breadcrumb } from '@src/router/UseBreadcrumbs';

afterEach(cleanup);

let captured: readonly Breadcrumb[] = [];

/** Captures the hook output at the leaf of the matched route tree. */
function Probe() {
  captured = useBreadcrumbs();
  return null;
}

/** Renders an `<Outlet>`-only layout so parent matches stay mounted. */
function Layout() {
  return <Outlet />;
}

function renderAt(routes: RouteObject[], path: string): readonly Breadcrumb[] {
  captured = [];
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return captured;
}

describe('useBreadcrumbs', () => {
  it('returns crumbs in match order, skipping matches without a handle', () => {
    const crumbs = renderAt(
      [
        {
          path: '/',
          element: <Layout />,
          handle: { crumb: 'Home' },
          id: 'root',
          children: [
            {
              path: 'projects',
              element: <Layout />,
              handle: { crumb: 'Projects' },
              id: 'projects',
              children: [
                { path: ':id', element: <Probe />, id: 'detail' }, // no handle → skipped
              ],
            },
          ],
        },
      ],
      '/projects/42',
    );

    expect(crumbs.map((c) => c.crumb)).toEqual(['Home', 'Projects']);
    expect(crumbs.map((c) => c.pathname)).toEqual(['/', '/projects']);
    expect(crumbs.map((c) => c.id)).toEqual(['root', 'projects']);
  });

  it('skips a match whose handle sets no crumb (title-only)', () => {
    const crumbs = renderAt(
      [
        {
          path: '/',
          element: <Layout />,
          handle: { title: 'Root' }, // handle present, crumb absent → skipped
          id: 'root',
          children: [{ path: 'settings', element: <Probe />, handle: { crumb: 'Settings' }, id: 'settings' }],
        },
      ],
      '/settings',
    );

    expect(crumbs).toHaveLength(1);
    expect(crumbs[0]).toEqual({ crumb: 'Settings', pathname: '/settings', id: 'settings' });
  });

  it('returns an empty trail when no match sets a crumb', () => {
    const crumbs = renderAt([{ path: '/', element: <Probe />, id: 'root' }], '/');

    expect(crumbs).toEqual([]);
  });
});
