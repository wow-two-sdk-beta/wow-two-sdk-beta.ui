import type { ComponentType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom';

import { createAppRouter, RouterHistory } from '@src/router/CreateAppRouter';
import type { GuardContext, RouteConfig } from '@src/router/RouteConfig';

// Compile-layer test: `createAppRouter` returns a live data router whose `routes` expose the
// compiled `RouteObject`s — root wrapper, catch-all, loaders (guards/redirect), lazy
// normalization. No navigation is driven (the runner URL only ever matches the `*` catch-all),
// so the shared browser context's history is never touched; routers are disposed after each test.

type AppRouter = ReturnType<typeof createAppRouter>;
const routers: AppRouter[] = [];

function make(config: RouteConfig, options?: Parameters<typeof createAppRouter>[1]): AppRouter {
  const router = createAppRouter(config, options);
  routers.push(router);
  return router;
}

afterEach(() => {
  for (const router of routers) router.dispose();
  routers.length = 0;
});

/** The compiled children of the injected root wrapper (app routes + the `*` catch-all). */
function childrenOf(router: AppRouter): RouteObject[] {
  return (router.routes[0]?.children ?? []) as RouteObject[];
}

/** Calls a compiled loader with a minimal loader-args shape. */
function callLoader(route: RouteObject, url = 'https://x/secret') {
  const loader = route.loader as (args: LoaderFunctionArgs) => Promise<unknown>;
  expect(typeof loader).toBe('function');
  return loader({ request: new Request(url), params: {}, context: undefined } as LoaderFunctionArgs);
}

/** Expects a loader rejection to be a react-router redirect Response and returns its target. */
async function redirectTarget(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
  } catch (thrown) {
    expect(thrown).toBeInstanceOf(Response);
    return (thrown as Response).headers.get('Location');
  }
  throw new Error('expected the loader to throw a redirect Response');
}

const Page: ComponentType = () => <p>page</p>;

describe('createAppRouter — structure', () => {
  it('wraps the config in a root route and appends the * catch-all last', () => {
    const router = make([{ path: 'a', element: <Page /> }, { path: 'b', element: <Page /> }]);

    const children = childrenOf(router);
    expect(children).toHaveLength(3);
    expect(children.map((route) => route.path)).toEqual(['a', 'b', '*']);
    expect(children[2]?.element).toBeTruthy(); // built-in NotFound
  });

  it('honors a custom notFound element on the catch-all', () => {
    const custom = <p>custom-404</p>;
    const router = make([], { notFound: custom });

    const children = childrenOf(router);
    expect(children).toHaveLength(1);
    expect(children[0]?.path).toBe('*');
    expect(children[0]?.element).toBe(custom);
  });

  it('passes basename through to the router', () => {
    const router = make([], { basename: '/app' });
    expect(router.basename).toBe('/app');
  });

  it('supports hash history', () => {
    const router = make([{ path: 'a', element: <Page /> }], { history: RouterHistory.Hash });
    expect(childrenOf(router).map((route) => route.path)).toEqual(['a', '*']);
  });

  it('compiles no loader when a route has neither guard nor redirect', () => {
    const router = make([{ path: 'a', element: <Page /> }]);
    expect(childrenOf(router)[0]?.loader).toBeUndefined();
  });

  it('maps nested children, index routes, and ids', () => {
    const router = make([
      {
        path: 'projects',
        element: <Page />,
        children: [
          { index: true, element: <Page />, id: 'projects-index' },
          { path: ':id', element: <Page />, id: 'projects-detail' },
        ],
      },
    ]);

    const projects = childrenOf(router)[0];
    expect(projects?.children?.[0]?.index).toBe(true);
    expect(projects?.children?.[0]?.id).toBe('projects-index');
    expect(projects?.children?.[1]?.path).toBe(':id');
    expect(projects?.children?.[1]?.id).toBe('projects-detail');
  });
});

describe('createAppRouter — guards + redirect compilation', () => {
  it('resolves null when every guard allows', async () => {
    const router = make([{ path: 'secret', element: <Page />, guard: () => true }]);
    await expect(callLoader(childrenOf(router)[0]!)).resolves.toBeNull();
  });

  it('throws a redirect Response when a guard blocks', async () => {
    const router = make([
      { path: 'secret', element: <Page />, guard: () => ({ redirect: '/login' }) },
    ]);

    await expect(redirectTarget(callLoader(childrenOf(router)[0]!))).resolves.toBe('/login');
  });

  it('runs a guard chain in order and short-circuits on the first block', async () => {
    const order: string[] = [];
    const first = vi.fn(() => {
      order.push('first');
      return { redirect: '/login' } as const;
    });
    const second = vi.fn(() => {
      order.push('second');
      return true as const;
    });
    const router = make([{ path: 'secret', element: <Page />, guard: [first, second] }]);

    await expect(redirectTarget(callLoader(childrenOf(router)[0]!))).resolves.toBe('/login');
    expect(order).toEqual(['first']);
    expect(second).not.toHaveBeenCalled();
  });

  it('passes the pending request and params to each guard', async () => {
    const guard = vi.fn<(context: GuardContext) => true>(() => true);
    const router = make([{ path: 'secret', element: <Page />, guard }]);

    await callLoader(childrenOf(router)[0]!, 'https://x/secret?tab=2');

    const context = guard.mock.calls[0]![0];
    expect(context.request.url).toBe('https://x/secret?tab=2');
    expect(context.params).toEqual({});
  });

  it('compiles `redirect` into a redirecting loader', async () => {
    const router = make([{ path: 'old', redirect: '/new' }]);
    await expect(redirectTarget(callLoader(childrenOf(router)[0]!))).resolves.toBe('/new');
  });

  it('runs guards before an unconditional redirect', async () => {
    const router = make([
      { path: 'old', redirect: '/new', guard: () => ({ redirect: '/login' }) },
    ]);

    await expect(redirectTarget(callLoader(childrenOf(router)[0]!))).resolves.toBe('/login');
  });
});

describe('createAppRouter — lazy normalization', () => {
  it('accepts a default-export module', async () => {
    const router = make([{ path: 'a', lazy: () => Promise.resolve({ default: Page }) }]);

    const lazy = childrenOf(router)[0]?.lazy as () => Promise<{ Component: ComponentType }>;
    await expect(lazy()).resolves.toEqual({ Component: Page });
  });

  it('accepts a named `Component` export module', async () => {
    const router = make([{ path: 'a', lazy: () => Promise.resolve({ Component: Page }) }]);

    const lazy = childrenOf(router)[0]?.lazy as () => Promise<{ Component: ComponentType }>;
    await expect(lazy()).resolves.toEqual({ Component: Page });
  });
});
