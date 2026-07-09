import { act, cleanup, render } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { afterEach, describe, it, expect } from 'vitest';

import { RouteAnnouncer } from './RouteAnnouncer';

afterEach(cleanup);

/** Renders the shell `<main>` (the focus target) with the announcer and the routed outlet. */
function Shell({ skipInitial }: { readonly skipInitial?: boolean }) {
  return (
    <main id="app-shell-main">
      <RouteAnnouncer skipInitial={skipInitial} />
      <Outlet />
    </main>
  );
}

function makeRouter(initial: string, skipInitial?: boolean) {
  return createMemoryRouter(
    [
      {
        element: <Shell skipInitial={skipInitial} />,
        children: [
          { index: true, element: <p>home</p>, handle: { title: 'Home' } },
          { path: 'library', element: <p>library</p>, handle: { title: 'Library' } },
        ],
      },
    ],
    { initialEntries: [initial] },
  );
}

function liveRegion(container: HTMLElement): Element | null {
  return container.querySelector('[aria-live="polite"]');
}

function mainEl(): HTMLElement | null {
  return document.getElementById('app-shell-main');
}

describe('RouteAnnouncer', () => {
  it('does not announce or move focus on the initial mount', () => {
    const router = makeRouter('/');
    const { container } = render(<RouterProvider router={router} />);

    expect(liveRegion(container)?.textContent).toBe('');
    expect(document.activeElement).not.toBe(mainEl());
  });

  it('announces the new title and moves focus to main on a subsequent navigation', async () => {
    const router = makeRouter('/');
    const { container } = render(<RouterProvider router={router} />);

    await act(async () => {
      await router.navigate('/library');
    });

    expect(liveRegion(container)?.textContent).toBe('Library');
    expect(document.activeElement).toBe(mainEl());
  });

  it('announces on the initial mount when skipInitial is false', () => {
    const router = makeRouter('/', false);
    const { container } = render(<RouterProvider router={router} />);

    expect(liveRegion(container)?.textContent).toBe('Home');
    expect(document.activeElement).toBe(mainEl());
  });

  it('falls back to the page <h1> when no main content region exists', async () => {
    const router = createMemoryRouter(
      [
        {
          element: (
            <>
              <RouteAnnouncer />
              <Outlet />
            </>
          ),
          children: [
            { index: true, element: <h1>Home</h1> },
            { path: 'library', element: <h1>Library heading</h1>, handle: { title: 'Library' } },
          ],
        },
      ],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    await act(async () => {
      await router.navigate('/library');
    });

    expect(document.activeElement).toBe(document.querySelector('h1'));
  });
});
