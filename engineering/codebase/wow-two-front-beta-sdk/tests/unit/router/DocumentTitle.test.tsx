import { act, cleanup, render } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';

import { DocumentTitle } from '@src/router/DocumentTitle';

let initialTitle: string;

beforeEach(() => {
  initialTitle = document.title;
  document.title = 'Initial';
});

afterEach(() => {
  cleanup();
  document.title = initialTitle;
});

/** Builds a memory router mounting the syncer at the root over titled child routes. */
function makeRouter(initial: string, suffix?: string) {
  return createMemoryRouter(
    [
      {
        element: (
          <>
            <DocumentTitle suffix={suffix} />
            <Outlet />
          </>
        ),
        children: [
          { index: true, element: <p>home</p>, handle: { title: 'Home' } },
          {
            path: 'projects',
            element: <Outlet />,
            handle: { title: 'Projects' },
            children: [{ path: ':id', element: <p>detail</p> }], // no own title → parent's wins
          },
          { path: 'about', element: <p>about</p> }, // no title anywhere
        ],
      },
    ],
    { initialEntries: [initial] },
  );
}

describe('DocumentTitle', () => {
  it('joins the deepest matched title with the suffix', () => {
    render(<RouterProvider router={makeRouter('/', 'App')} />);
    expect(document.title).toBe('Home · App');
  });

  it('uses the title alone when no suffix is set', () => {
    render(<RouterProvider router={makeRouter('/')} />);
    expect(document.title).toBe('Home');
  });

  it('falls back to the nearest ancestor title on an untitled child route', () => {
    render(<RouterProvider router={makeRouter('/projects/42', 'App')} />);
    expect(document.title).toBe('Projects · App');
  });

  it('falls back to the suffix alone when no matched route sets a title', () => {
    render(<RouterProvider router={makeRouter('/about', 'App')} />);
    expect(document.title).toBe('App');
  });

  it('leaves the document title untouched when neither a title nor a suffix exists', () => {
    render(<RouterProvider router={makeRouter('/about')} />);
    expect(document.title).toBe('Initial');
  });

  it('re-syncs on navigation', async () => {
    const router = makeRouter('/', 'App');
    render(<RouterProvider router={router} />);

    await act(async () => {
      await router.navigate('/projects/42');
    });

    expect(document.title).toBe('Projects · App');
  });
});
