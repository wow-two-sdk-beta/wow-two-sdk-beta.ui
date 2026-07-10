import { act, cleanup, render } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { afterEach, describe, it, expect } from 'vitest';

import { DocumentMeta } from './DocumentMeta';

/** Reads a named `<meta>` tag's content from the document head (null = no tag / no content). */
function metaContent(name: string): string | null {
  return document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.getAttribute('content') ?? null;
}

/** Removes every meta tag a test may have created — the head is shared across the browser-project run. */
function removeMetaTags(): void {
  for (const name of ['description', 'og:title', 'keywords']) {
    document.head.querySelector(`meta[name="${name}"]`)?.remove();
  }
}

afterEach(() => {
  cleanup();
  removeMetaTags();
});

/** Builds a memory router mounting the syncer at the root over meta-carrying child routes. */
function makeRouter(initial: string) {
  return createMemoryRouter(
    [
      {
        element: (
          <>
            <DocumentMeta />
            <Outlet />
          </>
        ),
        children: [
          {
            index: true,
            element: <p>home</p>,
            handle: { meta: { description: 'Home page', 'og:title': 'Home OG' } },
          },
          { path: 'library', element: <p>library</p>, handle: { meta: { description: 'Library page' } } },
          { path: 'about', element: <p>about</p> },
        ],
      },
    ],
    { initialEntries: [initial] },
  );
}

describe('DocumentMeta', () => {
  it('sets the description and arbitrary named tags from the deepest matched meta', () => {
    render(<RouterProvider router={makeRouter('/')} />);

    expect(metaContent('description')).toBe('Home page');
    expect(metaContent('og:title')).toBe('Home OG');
  });

  it('clears a tag set by the previous route when the next route omits that key', async () => {
    const router = makeRouter('/');
    render(<RouterProvider router={router} />);
    expect(metaContent('og:title')).toBe('Home OG');

    await act(async () => {
      await router.navigate('/library');
    });

    expect(metaContent('description')).toBe('Library page');
    expect(metaContent('og:title')).toBeNull(); // stale key from the home route is cleared
  });

  it('clears the description when navigating to a route with no meta at all', async () => {
    const router = makeRouter('/');
    render(<RouterProvider router={router} />);
    expect(metaContent('description')).toBe('Home page');

    await act(async () => {
      await router.navigate('/about');
    });

    expect(metaContent('description')).toBeNull();
    expect(metaContent('og:title')).toBeNull();
  });

  it('reuses one tag element across routes instead of stacking duplicates', async () => {
    const router = makeRouter('/');
    render(<RouterProvider router={router} />);

    await act(async () => {
      await router.navigate('/library');
    });
    await act(async () => {
      await router.navigate('/');
    });

    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(metaContent('description')).toBe('Home page');
  });
});
