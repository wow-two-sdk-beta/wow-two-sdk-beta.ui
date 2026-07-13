import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Outlet, RouterProvider, createMemoryRouter, type RouteObject } from 'react-router-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';

// Capture the props AppNavLink hands the router Link while still rendering the real component:
// href / label assert against real Link output, viewTransition forwarding asserts against the
// captured prop (it drives navigation, not a DOM attribute).
const { linkCalls } = vi.hoisted(() => ({ linkCalls: [] as Array<Record<string, unknown>> }));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  const { createElement } = await import('react');
  return {
    ...actual,
    Link: (props: Record<string, unknown>) => {
      linkCalls.push(props);
      return createElement(actual.Link, props as never);
    },
  };
});

import { AppNavLink } from '@src/router/AppNavLink';

afterEach(cleanup);

interface NavProps {
  readonly to: string;
  readonly end?: boolean;
  readonly viewTransition?: boolean;
}

function renderNav(props: NavProps, initialPath: string): HTMLElement {
  const routes: RouteObject[] = [
    {
      path: '/',
      element: (
        <>
          <AppNavLink to={props.to} end={props.end} viewTransition={props.viewTransition} icon={<span data-testid="icon" />}>
            Projects
          </AppNavLink>
          <Outlet />
        </>
      ),
      children: [
        { index: true, element: null },
        { path: 'projects', element: null },
        { path: 'projects/:id', element: null },
        { path: 'library', element: null },
      ],
    },
  ];
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  render(<RouterProvider router={router} />);
  return screen.getByRole('link', { name: 'Projects' });
}

describe('AppNavLink', () => {
  it('renders an anchor (the SDK NavItem forwards to Link) with the destination href', () => {
    expect(renderNav({ to: '/projects' }, '/library')).toHaveAttribute('href', '/projects');
  });

  it('renders the icon and label', () => {
    renderNav({ to: '/projects' }, '/library');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
  });

  it('marks active (aria-current + data-active) when the route matches', () => {
    const link = renderNav({ to: '/projects' }, '/projects');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('data-active');
  });

  it('is not active (no aria-current / data-active) when the route does not match', () => {
    const link = renderNav({ to: '/projects' }, '/library');
    expect(link).not.toHaveAttribute('aria-current');
    expect(link).not.toHaveAttribute('data-active');
  });

  it('with end unset, matches descendant paths (active on /projects/42)', () => {
    expect(renderNav({ to: '/projects' }, '/projects/42')).toHaveAttribute('data-active');
  });

  it('with end set, matches only the exact path (inactive on /projects/42)', () => {
    expect(renderNav({ to: '/projects', end: true }, '/projects/42')).not.toHaveAttribute('data-active');
  });

  it('forwards viewTransition to the router Link', () => {
    linkCalls.length = 0;
    renderNav({ to: '/projects', viewTransition: true }, '/library');
    expect(linkCalls.find((p) => p.to === '/projects')?.viewTransition).toBe(true);
  });

  it('leaves viewTransition undefined when not requested', () => {
    linkCalls.length = 0;
    renderNav({ to: '/projects' }, '/library');
    expect(linkCalls.find((p) => p.to === '/projects')?.viewTransition).toBeUndefined();
  });
});
