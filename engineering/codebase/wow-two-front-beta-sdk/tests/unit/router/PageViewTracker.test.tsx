import { StrictMode } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';

import { PageViewTracker, type PageView } from '@src/router/PageViewTracker';

afterEach(cleanup);

/** Builds a memory router that mounts the tracker at the root and renders titled child routes. */
function renderTracker(onPageView: (view: PageView) => void, initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <PageViewTracker onPageView={onPageView} />
            <Outlet />
          </>
        ),
        children: [
          { index: true, handle: { title: 'Projects' }, element: <p>projects</p> },
          { path: 'library', handle: { title: 'Library' }, element: <p>library</p> },
          { path: 'transcript/:id', element: <p>transcript</p> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe('PageViewTracker', () => {
  it('fires a page-view on mount with the matched title', () => {
    const onPageView = vi.fn();

    renderTracker(onPageView, '/');

    expect(onPageView).toHaveBeenCalledTimes(1);
    expect(onPageView).toHaveBeenLastCalledWith({ pathname: '/', title: 'Projects' });
  });

  it('fires again on each navigation with the new pathname + title', async () => {
    const onPageView = vi.fn();
    const router = renderTracker(onPageView, '/');

    await act(async () => {
      await router.navigate('/library');
    });

    expect(onPageView).toHaveBeenCalledTimes(2);
    expect(onPageView).toHaveBeenLastCalledWith({ pathname: '/library', title: 'Library' });
  });

  it('reports an undefined title when the matched route sets none', () => {
    const onPageView = vi.fn();

    renderTracker(onPageView, '/transcript/42');

    expect(onPageView).toHaveBeenCalledTimes(1);
    expect(onPageView).toHaveBeenLastCalledWith({ pathname: '/transcript/42', title: undefined });
  });

  it('emits exactly once per entry under StrictMode (double-invoked mount effect)', () => {
    const onPageView = vi.fn();
    const router = createMemoryRouter(
      [{ path: '/', handle: { title: 'Projects' }, element: <PageViewTracker onPageView={onPageView} /> }],
      { initialEntries: ['/'] },
    );

    render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );

    expect(onPageView).toHaveBeenCalledTimes(1);
  });

  it('fires again for a search-param navigation (new entry, same pathname)', async () => {
    const onPageView = vi.fn();
    const router = renderTracker(onPageView, '/library');

    await act(async () => {
      await router.navigate('/library?page=2');
    });

    expect(onPageView).toHaveBeenCalledTimes(2);
    expect(onPageView).toHaveBeenLastCalledWith({ pathname: '/library', title: 'Library' });
  });
});
